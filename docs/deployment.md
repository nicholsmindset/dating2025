# Deployment and Configuration Guide

This project now validates its runtime configuration at boot time. The application will exit immediately if any required environment variables are missing or malformed. Follow the guidance below to provide configuration securely in production deployments.

## Required environment variables

The backend enforces the presence of the following variables:

- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `MONGODB_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- `ADMIN_EMAILS` (comma-separated list; may be empty)

Provide these values through your process manager, orchestrator, or secret management tooling. The server will refuse to start until every required variable is supplied.

## Secure delivery patterns

- **Container orchestrators (Docker/Kubernetes):** define the variables through orchestrator secrets. For example, reference Docker secrets via `env_file` entries or mount secret files and load them into the environment.
- **Cloud hosts (Heroku, Render, Railway, Fly.io, etc.):** configure each secret using the provider's environment variable manager. Rotate credentials regularly.
- **Infrastructure-as-Code pipelines:** store sensitive values in secret managers such as AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault. Inject them into the runtime environment during deployment.
- **Local production-like environments:** create a `.env.production` file managed by your secrets tooling. Restrict file permissions (`chmod 600`) and never commit `.env` files to source control.

## Verifying configuration before deployment

Run the smoke check to guarantee all required configuration is available:

```bash
cd backend
npm run config:check
```

The script imports the configuration loader and exits with a non-zero status when validation fails. Integrate this command into CI/CD pipelines, container health checks, or startup probes to detect misconfiguration early.

## Rate limiting store

The application now requires a Redis instance for rate limiting. Ensure the `REDIS_URL` points to a reachable Redis deployment (managed Redis service, self-hosted instance, or Redis cluster). Connectivity issues will cause the server to exit during startup, providing a clear failure signal that rate limiting cannot function without Redis.

## Applying secrets during deployment

1. Store all sensitive values in your chosen secret manager.
2. Update your deployment manifests or process manager to inject the secrets as environment variables.
3. Before promoting the release, run `npm run config:check` and a lightweight health check (e.g., hitting `/api/health`) in the deployment environment.
4. Monitor startup logs—configuration and Redis connectivity confirmations are logged at boot.

Following these steps ensures the service starts with the required configuration and fails fast when secrets are missing.
