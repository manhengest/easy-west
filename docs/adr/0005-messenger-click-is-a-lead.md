---
status: superseded by ADR-0006
---

Superseded by [0006](0006-chat-card-is-the-lead-home.md).

# A messenger click is a lead

A click on Telegram, WhatsApp, or Viber in the hero, the lower CTA, or the footer is a lead: one per browser and channel for 30 days, titled `Лід {id}` after KeyCRM accepts the card. A form before the chat was rejected because the person already chose to write, and another form drops the tap. A card on every tap was rejected because the same person would fill the pipeline with empty clicks. The website form stays a separate lead. The click does not go through Stape, email, or the team Telegram bot, so a tap with no message is not `generate_lead`. Qualification and booking on this card still reach ads through the existing webhook. KeyCRM must not open a pipeline card from the chat itself: otherwise an empty «Чат з …» sits beside `Лід N`. A call and an email from the site are not leads.
