"""
🔐 Authentication Models for Luna Session Zero
Phoenix Backend Unified - Auth & User Management
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

class UserRegistrationIn(BaseModel):
    """User registration payload from Luna Modal"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, max_length=128, description="User password")
    
    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v

class UserRegistrationOut(BaseModel):
    """User registration response with JWT token"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_id: str = Field(..., description="Created user ID")
    email: str = Field(..., description="User email")

class User(BaseModel):
    """User entity for internal use"""
    id: str = Field(..., description="User unique identifier")
    email: str = Field(..., description="User email address")
    password_hash: str = Field(..., description="Hashed password")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    is_active: bool = Field(default=True, description="Account status")
    
    # Luna specific fields
    luna_energy: int = Field(default=100, description="Current Luna energy level")
    capital_narratif_started: bool = Field(default=False, description="Has started Capital Narratif journey")

class NarrativeStartIn(BaseModel):
    """Capital Narratif start payload"""
    motivation: str = Field(..., min_length=10, max_length=1000, description="User's motivation for career transition")
    
    @field_validator("motivation")
    @classmethod
    def validate_motivation(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Motivation cannot be empty")
        if len(v.strip()) < 10:
            raise ValueError("Motivation must be at least 10 characters long")
        return v.strip()

class NarrativeStartOut(BaseModel):
    """Capital Narratif start response"""
    narrative_id: str = Field(..., description="Generated narrative journey ID")
    status: str = Field(default="started", description="Narrative status")
    energy_granted: int = Field(default=100, description="Energy granted for starting the journey")

class LoginRequest(BaseModel):
    """Login request payload"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, max_length=128, description="User password")