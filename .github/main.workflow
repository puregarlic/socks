workflow "wat is gollum" {
  resolves = ["Telegram Notify"]
  on = "gollum"
}

action "Telegram Notify" {
  uses = "appleboy/telegram-action@0.0.3"
  secrets = [
    "TELEGRAM_TOKEN",
    "TELEGRAM_TO",
  ]
  args = "A new commit has been pushed."
}
