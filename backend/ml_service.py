# ============================================================
# ML SERVICE - IMPROVED with Domain Rules
# ============================================================

import pickle
import json
import numpy as np
import os
from pathlib import Path

class MLService:
    """Service for ML model operations with domain rule enhancement"""

    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.encoders = None
        self.config = None
        self.historical_stats = None
        self.severity_reference = None
        self._load_artifacts()

        # Domain rules for magnitude-based severity boost
        self.magnitude_rules = {
            'Earthquake': {
                'thresholds': [4.0, 5.5, 7.0, 8.0],  # Richter scale
                'severity_boost': [0, 0, 1, 2]       # Boost severity by this much
            },
            'Storm': {
                'thresholds': [4.0, 6.0, 7.5, 9.0],  # Normalized scale
                'severity_boost': [0, 0, 1, 2]
            },
            'Flood': {
                'thresholds': [3.0, 5.0, 7.0, 8.5],
                'severity_boost': [0, 0, 1, 1]
            },
            'Volcanic activity': {
                'thresholds': [3.0, 5.0, 6.5, 8.0],
                'severity_boost': [0, 1, 1, 2]
            },
            'Wildfire': {
                'thresholds': [3.0, 5.0, 7.0, 8.5],
                'severity_boost': [0, 0, 1, 1]
            },
            'Drought': {
                'thresholds': [4.0, 6.0, 7.5, 9.0],
                'severity_boost': [0, 0, 1, 1]
            },
            'Landslide': {
                'thresholds': [3.0, 5.0, 6.5, 8.0],
                'severity_boost': [0, 0, 1, 2]
            },
            'Epidemic': {
                'thresholds': [3.0, 5.0, 7.0, 8.5],
                'severity_boost': [0, 1, 1, 2]
            }
        }

    def _load_artifacts(self):
        """Load all model artifacts"""
        try:
            # Load model
            with open(f'{self.model_dir}/severity_model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            print("✓ Loaded severity_model.pkl")

            # Load scaler
            with open(f'{self.model_dir}/feature_scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            print("✓ Loaded feature_scaler.pkl")

            # Load encoders
            with open(f'{self.model_dir}/label_encoders.pkl', 'rb') as f:
                self.encoders = pickle.load(f)
            print("✓ Loaded label_encoders.pkl")

            # Load config
            with open(f'{self.model_dir}/feature_config.json', 'r') as f:
                self.config = json.load(f)
            print("✓ Loaded feature_config.json")

            # Load historical stats
            with open(f'{self.model_dir}/historical_stats.json', 'r') as f:
                self.historical_stats = json.load(f)
            print("✓ Loaded historical_stats.json")

            # Load severity reference
            with open(f'{self.model_dir}/severity_reference.json', 'r') as f:
                self.severity_reference = json.load(f)
            print("✓ Loaded severity_reference.json")

            print("\n✓ All ML artifacts loaded successfully!")

        except Exception as e:
            print(f"✗ Error loading ML artifacts: {e}")
            raise e

    def _get_magnitude_boost(self, disaster_type: str, magnitude: float) -> int:
        """
        Get severity boost based on disaster type and magnitude
        Uses domain knowledge rules
        """
        rules = self.magnitude_rules.get(disaster_type, None)

        if rules is None:
            # Default rules for unknown disaster types
            if magnitude >= 8.0:
                return 2
            elif magnitude >= 7.0:
                return 1
            return 0

        thresholds = rules['thresholds']
        boosts = rules['severity_boost']

        # Find which threshold bracket the magnitude falls into
        boost = 0
        for i, threshold in enumerate(thresholds):
            if magnitude >= threshold:
                boost = boosts[i]

        return boost

    def _adjust_probabilities(self, probabilities: list, boost: int) -> list:
        """
        Adjust probability distribution based on severity boost
        Shifts probability mass toward higher severity levels
        """
        if boost == 0:
            return probabilities

        probs = np.array(probabilities)

        # Shift probability mass toward higher severities
        shift_amount = 0.15 * boost  # 15% shift per boost level

        # Reduce lower severity probabilities
        for i in range(max(0, 3 - boost)):
            reduction = min(probs[i], shift_amount / (4 - boost))
            probs[i] -= reduction
            # Add to higher severities
            for j in range(max(i + 1, 4 - boost), 4):
                probs[j] += reduction / boost if boost > 0 else 0

        # Normalize to ensure sum = 1
        probs = np.clip(probs, 0, 1)
        probs = probs / probs.sum()

        return probs.tolist()

    def predict_severity(
        self,
        disaster_type: str,
        disaster_subtype: str,
        continent: str,
        region: str,
        month: int,
        magnitude: float,
        duration_months: float = 0,
        year: int = 2024
    ) -> dict:
        """
        Predict disaster severity with domain rule enhancement

        Returns dict with:
        - severity: int (0-3)
        - severity_label: str
        - probabilities: list
        - confidence: float
        - priority_score: float
        - ml_severity: int (original ML prediction)
        - boost_applied: int (domain rule boost)
        """

        # Handle None subtype
        if disaster_subtype is None:
            disaster_subtype = "Unknown"

        # Encode subtype
        try:
            subtype_encoded = self.encoders['subtype_encoder'].transform([disaster_subtype])[0]
        except:
            subtype_encoded = 0

        # Encode region
        try:
            region_encoded = self.encoders['region_encoder'].transform([region])[0]
        except:
            region_encoded = 0

        # Cyclical month encoding
        month_sin = np.sin(2 * np.pi * month / 12)
        month_cos = np.cos(2 * np.pi * month / 12)

        # Normalize magnitude (if not already 0-1)
        if magnitude > 1:
            magnitude_normalized = min(magnitude / 10.0, 1.0)
        else:
            magnitude_normalized = magnitude

        # Normalize duration
        duration_normalized = min(np.log1p(duration_months) / 5, 1.0)

        # Normalize year
        year_normalized = (year - 1900) / (2024 - 1900)
        year_normalized = max(0, min(1.2, year_normalized))

        # Numerical features
        numerical = [
            float(subtype_encoded),
            float(region_encoded),
            float(month_sin),
            float(month_cos),
            float(magnitude_normalized),
            float(duration_normalized),
            float(year_normalized)
        ]

        # One-hot encode disaster type
        disaster_type_features = [
            1.0 if f'type_{disaster_type}' == col else 0.0
            for col in self.config['disaster_type_columns']
        ]

        # One-hot encode continent
        continent_features = [
            1.0 if f'continent_{continent}' == col else 0.0
            for col in self.config['continent_columns']
        ]

        # Combine features
        features = np.array(
            numerical + disaster_type_features + continent_features
        ).reshape(1, -1)

        # Scale numerical features
        num_numerical = self.config['num_numerical_features']
        features_scaled = features.copy()
        features_scaled[:, :num_numerical] = self.scaler.transform(features[:, :num_numerical])

        # Get ML prediction
        ml_severity = int(self.model.predict(features_scaled)[0])
        ml_probabilities = self.model.predict_proba(features_scaled)[0].tolist()

        # Apply domain rules boost
        boost = self._get_magnitude_boost(disaster_type, magnitude)

        # Calculate final severity (ML + boost, capped at 3)
        final_severity = min(ml_severity + boost, 3)

        # Adjust probabilities based on boost
        adjusted_probabilities = self._adjust_probabilities(ml_probabilities, boost)

        severity_labels = ['Low', 'Moderate', 'High', 'Critical']

        # Calculate priority score (0-100)
        # Higher severity = higher priority
        # Also factor in magnitude
        priority_score = (
            (final_severity + 1) * 20 +  # Base from severity (20, 40, 60, 80)
            magnitude_normalized * 15 +   # Magnitude contribution (0-15)
            max(adjusted_probabilities) * 5  # Confidence contribution (0-5)
        )
        priority_score = min(100, max(0, priority_score))

        # Additional priority boost for very high magnitude
        if magnitude >= 7.0:
            priority_score = min(100, priority_score + 10)
        if magnitude >= 8.0:
            priority_score = min(100, priority_score + 10)

        return {
            'severity': final_severity,
            'severity_label': severity_labels[final_severity],
            'probabilities': adjusted_probabilities,
            'confidence': float(max(adjusted_probabilities)),
            'priority_score': round(priority_score, 2),
            'ml_severity': ml_severity,
            'ml_severity_label': severity_labels[ml_severity],
            'boost_applied': boost,
            'magnitude_used': magnitude
        }

    def get_disaster_types(self) -> list:
        """Get list of supported disaster types"""
        return self.config.get('disaster_types', [])

    def get_subtypes_by_type(self) -> dict:
        """Get subtypes organized by disaster type"""
        return self.config.get('subtypes_by_type', {})

    def get_continents(self) -> list:
        """Get list of continents"""
        return self.config.get('continents', [])

    def get_regions(self) -> list:
        """Get list of regions"""
        return self.config.get('regions', [])

    def get_severity_reference(self) -> dict:
        """Get severity level reference"""
        return self.severity_reference

    def get_historical_stats(self) -> dict:
        """Get historical statistics"""
        return self.historical_stats


# Global ML service instance
ml_service = None

def get_ml_service() -> MLService:
    """Get or create ML service instance"""
    global ml_service
    if ml_service is None:
        ml_service = MLService()
    return ml_service
