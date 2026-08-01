Feature: Blog
  As a visitor
  I want to read the company blog
  So that I can learn more about testing HubSpot sites

  Background:
    Given I am on "/blog/index.html"

  Scenario: Blog listing is served by HubSpot
    Then the page should be a HubSpot page
    And the HubSpot blog should list at least 3 posts

  Scenario: Opening a blog post navigates to the full article
    When I open the HubSpot blog post titled "5 tips for testing a HubSpot CMS site"
    Then I should see "5 tips for testing a HubSpot CMS site"
