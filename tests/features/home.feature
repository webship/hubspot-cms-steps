# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: Home page
  As a visitor
  I want the home page to load correctly
  So that I can navigate to the rest of the site

  Background:
    Given I am on "/index.html"

  Scenario: Home page is served by HubSpot
    Then the page should be a HubSpot page
    And I should see "Turn website visitors into customers"

  Scenario: Home page menu links to every main page
    Then the HubSpot menu should have a link labeled "Home"
    And the HubSpot menu should have a link labeled "Pricing"
    And the HubSpot menu should have a link labeled "About"
    And the HubSpot menu should have a link labeled "Blog"
    And the HubSpot menu should have a link labeled "Contact"
    And the HubSpot menu should not have a link labeled "Checkout"

  Scenario: Menu links lead to the right pages and the current page is marked
    Then the HubSpot menu link "Pricing" should link to "/pricing.html"
    And the HubSpot menu link "Contact" should link to "/contact-us.html"
    And the HubSpot menu link "Home" should be active
    And the HubSpot menu link "Pricing" should not be active

  Scenario: The Resources item opens a submenu
    Then the HubSpot menu item "Resources" should have a submenu link "Blog"
    And the HubSpot menu item "Resources" should not have a submenu link "Pricing"
    When I open the HubSpot menu item "Resources"
    And I click the HubSpot menu link "Blog"
    Then I should be on "/blog/"

  Scenario: A menu link is followed
    When I click the HubSpot menu link "Pricing"
    Then I should be on "/pricing.html"
    And the HubSpot menu link "Pricing" should be active

  Scenario: Hero CTA links to the pricing page
    Then the HubSpot CTA "See Pricing" should be visible
    And the HubSpot CTA "See Pricing" should link to "/pricing.html"
    And the HubSpot CTA "See Pricing" should not link to "/contact-us.html"
