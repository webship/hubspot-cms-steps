# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: Blog
  As a visitor
  I want to read the company blog
  So that I can learn more about testing HubSpot sites

  Background:
    Given I am on "/blog/"

  Scenario: Blog listing is served by HubSpot
    Then the page should be a HubSpot page
    And the page should be a HubSpot blog listing page
    And the page should not be a HubSpot blog post page
    And the HubSpot blog should list at least 3 posts

  Scenario: Opening a blog post navigates to the full article
    When I open the HubSpot blog post titled "Testing HubSpot forms without sending them"
    Then the page should be a HubSpot blog post page
    And I should see "Testing HubSpot forms without sending them"
    And the HubSpot blog post should be written by "Jane Doe"
    And the HubSpot blog post should be tagged "Testing"
    And the HubSpot blog post should not be tagged "Marketing"

  Scenario: The listing has a second page
    Then the HubSpot blog should have pagination
    When I go to page 2 of the HubSpot blog
    Then I should be on "/blog/page/2/"
    And the HubSpot blog should list at least 2 posts
    And I should see "Why BDD testing matters for marketing sites"
    When I go to page 1 of the HubSpot blog
    Then I should be on "/blog/"

  Scenario: A tag lists its posts
    Then the HubSpot blog should have the tag "Testing"
    When I open the HubSpot blog tag "Automation"
    Then I should be on "/blog/tag/automation/"
    And the HubSpot blog should list at least 1 post
    And I should see "Automating website QA with webship-js"
    And I should not see "Why BDD testing matters for marketing sites"

  Scenario: A tag with several posts lists them all
    When I open the HubSpot blog tag "Testing"
    Then the HubSpot blog should list at least 3 posts
    And the HubSpot blog should not have the tag "Finance"
