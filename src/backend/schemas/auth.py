import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Email адрес пользователя")
    password: str = Field(..., min_length=8, max_length=128, description="Пароль (мин. 8 символов)")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Email адрес пользователя")
    password: str = Field(..., description="Пароль")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Тип токена")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="UUID пользователя")
    email: str = Field(..., description="Email пользователя")
    is_active: bool = Field(..., description="Активен ли аккаунт")

    @field_validator("id", mode="before")
    @classmethod
    def convert_uuid(cls, v: uuid.UUID | str) -> str:
        return str(v)
