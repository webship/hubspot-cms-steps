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
    Then the menu should have a link labeled "Home"
    And the menu should have a link labeled "Pricing"
    And the menu should have a link labeled "About"
    And the menu should have a link labeled "Blog"
    And the menu should have a link labeled "Contact"
    And the menu should not have a link labeled "Checkout"

  Scenario: Menu links lead to the right pages and the current page is marked
    Then the menu link "Pricing" should link to "/pricing.html"
    And the menu link "Contact" should link to "/contact-us.html"
    And the menu link "Home" should be active
    And the menu link "Pricing" should not be active

  Scenario: The Resources item opens a submenu
    Then the menu item "Resources" should have a submenu link "Blog"
    And the menu item "Resources" should not have a submenu link "Pricing"
    When I open the menu item "Resources"
    And I click the menu link "Blog"
    Then I should be on "/blog/"

  Scenario: A menu link is followed
    When I click the menu link "Pricing"
    Then I should be on "/pricing.html"
    And the menu link "Pricing" should be active

  Scenario: Hero CTA links to the pricing page
    Then the CTA "See Pricing" should be visible
    And the CTA "See Pricing" should link to "/pricing.html"
    And the CTA "See Pricing" should not link to "/contact-us.html"
