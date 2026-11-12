# Read-only check against a public site built on HubSpot CMS: the chat widget the
# chat script adds after the page has loaded. See huble.com.feature for how the
# real-site files are run.
@real-site
Feature: HubSpot chat widget on a public site
  As a tester of a HubSpot CMS site
  I want to know the chat widget is on the page
  So that visitors can reach the team

  Scenario: The chat widget is added to the page
    Given the HubSpot cookie consent is accepted
    And I am on "/"
    Then the page should be a HubSpot page
    And the HubSpot tracking code should be installed for portal "53"
    And the HubSpot chat widget should be present
