# Read-only checks against a public site built on HubSpot CMS: the tag links of
# a blog listing, whose text carries a post count ("API (3)"). See
# huble.com.feature for how the real-site files are run.
@real-site
Feature: HubSpot blog tags on a public site
  As a tester of a HubSpot CMS site
  I want the tag steps to work on the markup HubSpot really renders
  So that I can trust them on my own site

  Scenario: A tag is found and opened
    Given I am on "/blog"
    Then the page should be a HubSpot blog listing page
    And the HubSpot blog should have the tag "API"
    And the HubSpot blog should not have the tag "No such tag"
    When I open the HubSpot blog tag "API"
    Then I should be on "/blog/tag/api"
    And the page should be a HubSpot blog listing page
    And the HubSpot blog should list at least 1 post
