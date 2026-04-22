from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://stevekim@localhost:5432/skillful_marketplace"
    jwt_secret: str = "dev-change-me-supersecret"
    jwt_algorithm: str = "HS256"
    cors_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
