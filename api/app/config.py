from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://stevekim@localhost:5432/skillful_marketplace"
    jwt_secret: str = "dev-change-me-supersecret"
    jwt_algorithm: str = "HS256"
    # Preferred: CORS_ORIGINS (comma-separated). CORS_ORIGIN (singular) is
    # kept as a fallback for backward compatibility with old .env files.
    cors_origins: str = ""
    cors_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        raw = self.cors_origins or self.cors_origin
        return [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()
