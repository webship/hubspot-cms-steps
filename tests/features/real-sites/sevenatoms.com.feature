# Read-only checks against a public site built on HubSpot CMS: the menu module
# with submenus, and CTAs whose href is HubSpot's tracking redirect. See
# huble.com.feature for how the real-site files are run.
@real-site
Feature: HubSpot menu and CTAs on a public site
  As a tester of a HubSpot CMS site
  I want the menu and CTA steps to work on the markup HubSpot really renders
  So that I can trust them on my own site

  Scenario: The menu module has a submenu and marks the current page
    Given I am on "/ai-marketing-agency"
    Then the page should be a HubSpot page
    And the menu should have a link labeled "SERVICES"
    And the menu item "SERVICES" should have a submenu link "GOOGLE ADS MANAGEMENT"
    And the menu link "AI MARKETING" should be active
    And the menu link "GOOGLE ADS MANAGEMENT" should not be active
    And the menu link "GOOGLE ADS MANAGEMENT" should link to "/google-adwords-agency"

  Scenario: A submenu link is reached through its parent item
    Given I am on "/"
    When I open the menu item "SERVICES"
    And I click the menu link "AI MARKETING"
    Then I should be on "/ai-marketing-agency"

  Scenario: A CTA leads to its destination, not to the tracking redirect
    Given I am on "/"
    Then the CTA "GET PROPOSAL" should link to "/get-proposal"
    When I click the CTA "GET PROPOSAL"
    Then I should be on "/get-proposal"
