# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: Site search
  As a visitor
  I want to search the site
  So that I can find a page without browsing

  Background:
    Given I am on "/index.html"

  Scenario: The home page has a search field
    Then the page should have a HubSpot site search

  Scenario: A search lists the matching pages and posts
    When I search the HubSpot site for "testing"
    Then I should be on "/hs-search-results"
    And the HubSpot search results should list at least 3 results
    And the HubSpot search results should include "5 tips for testing a HubSpot CMS site"
    And the HubSpot search results should not include "Pricing"

  Scenario: A result can be opened
    When I search the HubSpot site for "pricing"
    And I open the HubSpot search result "Pricing"
    Then I should be on "/pricing.html"

  Scenario: A search with no match says so
    When I search the HubSpot site for "zzzzqqq"
    Then the HubSpot search should find no results
