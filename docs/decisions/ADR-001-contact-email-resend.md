# ADR-001: Send contact form messages with Resend

## Status

Accepted

## Context

The contact form needs to deliver messages from a Next.js serverless application. The existing site has no verified office email address in its public content, so delivery must use deployment configuration rather than a guessed address. Provider credentials must remain server-side.

## Decision

Use Resend's email API from the `/api/contact` server route. Configure `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, and `CONTACT_TO_EMAIL` in the deployment environment. The sender address must use a domain verified in Resend; the visitor's validated address is used as `reply_to`.

## Alternatives considered

- **WhatsApp handoff:** easy to start, but depends on a visitor leaving the site and is not a delivered form submission.
- **Mailto link:** requires a configured mail application and cannot report delivery status.
- **Self-hosted SMTP:** adds mail server configuration and deliverability maintenance.

## Consequences

- The API key and routing addresses stay on the server.
- The form reports success only after Resend accepts the email.
- Production delivery remains disabled until the three environment values are set and the sender domain is verified.
- The endpoint validates and limits submitted fields, checks the request origin, and uses a honeypot field. A durable rate limiter may be added if abuse becomes material.
