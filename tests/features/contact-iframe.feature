# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
@forms
Feature: Contact form in an iframe
  As a prospective customer
  I want to use the contact form HubSpot shows in an iframe
  So that the sales team can follow up with me, however the form is embedded

  Background:
    Given I am on "/contact-iframe.html"

  Scenario: The form inside the iframe is found
    Then the page should have a form
    And the form should have a field "email"
    And the form field "email" should be required

  Scenario: Submitting an empty form shows the validation errors
    When I submit the form
    Then the form field "lastname" should show an error
    And the form should show an error containing "Please complete all required fields."

  Scenario: Submitting the form inside the iframe shows a success message
    When we fill in the form field "firstname" with "Jane"
    And we fill in the form field "lastname" with "Doe"
    And we fill in the form field "email" with "jane.doe@example.com"
    And we submit the form
    Then the form should show a success message containing "received your message"
