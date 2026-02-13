---
# An instance of the Contact widget.
widget: contact

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 130

title: Contact
subtitle: I usually reply within 2 business days.

content:
  # Automatically link email and phone or display as text?
  autolink: true

  # Email form provider
  form:
    provider: netlify
    formspree:
      id:
    netlify:
      # Keep this false so reCAPTCHA script is not loaded on every page view.
      # (Safer performance default for a public portfolio site.)
      captcha: false

  # Contact details (edit or remove options as required)
  email: peter1125@gmail.com
  contact_links:
    - icon: linkedin
      icon_pack: fab
      name: LinkedIn
      link: https://linkedin.com/in/peter1125
    - icon: github
      icon_pack: fab
      name: GitHub
      link: https://github.com/peter1125
#   phone: 
#   address:
#     street: 
#     city: 
#     region: 
#     postcode: 
#     country: 
#     country_code: 
#   coordinates:
#     latitude: 
#     longitude: 
#   directions: 
#   office_hours:
#     - 
#     - 
#   appointment_url: 
#   contact_links:
#     - icon: 
#       icon_pack: 
#       name: 
#       link: 
#     - icon: 
#       icon_pack: 
#       name: 
#       link: 

# design:
#   columns: '2'
---
