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

  Scenario: Hero CTA links to the pricing page
    Then the HubSpot CTA "See Pricing" should link to "/pricing.html"

  Scenario: Visitor can accept the cookie banner
    Then the HubSpot cookie banner should be visible
    When I accept the HubSpot cookie banner
    Then the HubSpot cookie banner should not be visible

  Scenario: Visitor can decline the cookie banner
    Then the HubSpot cookie banner should be visible
    When I decline the HubSpot cookie banner
    Then the HubSpot cookie banner should not be visible
