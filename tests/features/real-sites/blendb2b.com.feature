# Read-only checks against a public site built on HubSpot CMS: a blog listing
# whose markup is the theme's own, the pagination, and the default search
# results. See huble.com.feature for how the real-site files are run.
@real-site
Feature: HubSpot blog and search on a public site
  As a tester of a HubSpot CMS site
  I want the blog and search steps to work on the markup HubSpot really renders
  So that I can trust them on my own site

  Scenario: A blog listing is recognised and its posts are counted
    Given I am on "/blog"
    Then the page should be a HubSpot page
    And the page should be a blog listing page
    And the page should not be a blog post page
    And the blog should list at least 3 posts
    And the blog should have pagination

  Scenario: A numbered page of the blog is reached through its link
    Given I am on "/blog"
    When I go to page 2 of the blog
    Then I should be on "/blog/page/2"
    And the page should be a blog listing page
    And the blog should list at least 3 posts

  Scenario: A post is opened from the listing by its title
    Given I am on "/blog"
    When I open the blog post titled "ABM strategy"
    Then the page should be a blog post page

  Scenario: The default search results list the matches
    Given I am on "/"
    When I search the site for "hubspot"
    Then I should be on "/hs-search-results"
    And the search results should list at least 5 results
    And the search results should include "HubSpot"

  Scenario: A search with no match says so
    Given I am on "/"
    When I search the site for "zzzzqqq"
    Then the search should find no results
