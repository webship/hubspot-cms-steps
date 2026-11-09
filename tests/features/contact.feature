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

  Scenario: Submitting the HubSpot form shows a success message
    When I fill in the HubSpot form field "firstname" with "Jane"
    And I fill in the HubSpot form field "lastname" with "Doe"
    And I fill in the HubSpot form field "email" with "jane.doe@example.com"
    And I fill in the HubSpot form field "message" with "Please call me back"
    And I submit the HubSpot form
    Then the HubSpot form should show a success message
    And the HubSpot form should show a success message containing "received your message"
