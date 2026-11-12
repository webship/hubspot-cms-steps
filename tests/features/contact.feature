# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: Contact Us page
  As a prospective customer
  I want to submit the contact form
  So that the sales team can follow up with me

  Background:
    Given I am on "/contact-us.html"

  Scenario: Contact page is served by HubSpot
    Then the page should be a HubSpot page
    And I should see "Contact us"
    And the page should have a HubSpot form

  Scenario: The form has the fields the sales team needs
    Then the HubSpot form should have a field "firstname"
    And the HubSpot form should have a field "lastname"
    And the HubSpot form should have a field "email"
    And the HubSpot form should have a field "Country"
    And the HubSpot form should not have a field "fax"

  Scenario: Name and email are required
    Then the HubSpot form field "firstname" should be required
    And the HubSpot form field "lastname" should be required
    And the HubSpot form field "email" should be required
    And the HubSpot form field "message" should not be required

  Scenario: Submitting an empty form shows the validation errors
    When I submit the HubSpot form
    Then the HubSpot form field "firstname" should show an error containing "Please complete this required field."
    And the HubSpot form field "email" should show an error
    And the HubSpot form field "message" should not show an error
    And the HubSpot form should show an error containing "Please complete all required fields."
    And the HubSpot form should not show a success message

  Scenario: A malformed email address is refused
    When I fill in the HubSpot form field "firstname" with "Jane"
    And I fill in the HubSpot form field "lastname" with "Doe"
    And I fill in the HubSpot form field "email" with "jane.doe"
    And I submit the HubSpot form
    Then the HubSpot form field "email" should show an error containing "Email must be formatted correctly."
    And the HubSpot form field "firstname" should not show an error

  Scenario: Submitting the HubSpot form shows a success message
    When I fill in the HubSpot form field "firstname" with "Jane"
    And I fill in the HubSpot form field "lastname" with "Doe"
    And I fill in the HubSpot form field "email" with "jane.doe@example.com"
    And I fill in the HubSpot form field "country" with "Jordan"
    And I fill in the HubSpot form field "message" with "Please call me back"
    And I tick the HubSpot form checkbox "I agree to receive other communications from Acme Analytics."
    And I submit the HubSpot form
    Then the HubSpot form should show a success message
    And the HubSpot form should show a success message containing "received your message"
    And the HubSpot form should not show an error
