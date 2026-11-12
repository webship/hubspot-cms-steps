# Read-only checks against a public page built on HubSpot CMS: a form on a sales
# page, found by its internal field names. See huble.com.feature for how the
# real-site files are run.
@real-site
Feature: HubSpot forms on a public sales page
  As a tester of a HubSpot CMS site
  I want to find the fields of a form by their internal names
  So that I can fill them without writing selectors

  Scenario: The sales form has its fields and required markers
    Given I am on "/contact-sales"
    Then the page should have a HubSpot form
    And the HubSpot form should have a field "firstname"
    And the HubSpot form should have a field "email"
    And the HubSpot form field "email" should be required
