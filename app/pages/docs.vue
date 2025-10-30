<template>
<div>
<h1>CBD Calendar Search Component Documentation</h1>

<p>
  This guide explains how to use the <strong>Calendar of Activities &amp; Actions</strong> search component
  provided by the Convention on Biological Diversity (CBD).  The component allows you to
  filter and visualise meetings, activities and other records using a powerful yet
  intuitive interface.
</p>

<h2>Overview</h2>
<p>
  The search component consists of three main areas:
</p>
<ul>
  <li><strong>View controls:</strong> a toggle for “Tab View by Record Type” and two buttons for “Grid View” and “List View”.</li>
  <li><strong>Filter panel:</strong> contains the search bar and various filters (in basic or advanced mode).</li>
  <li><strong>Results area:</strong> displays activities in grid or list format.</li>
</ul>

<div class="screenshot">
  <!-- Replace image1.png with the actual screenshot (citation 850194525278070†screenshot) -->
  <img src="/image1.png" alt="Advanced search interface (citation 850194525278070†screenshot)">
  <div class="caption">Figure&nbsp;1: The component in its default advanced‑search state (citation 850194525278070†screenshot).</div>
</div>

<h2>View Modes</h2>
<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Purpose</th>
      <th>How to use</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Tab View by Record Type</strong></td>
      <td>Organises results into tabs (Meetings, Notifications, Activities, Peer‑reviews, etc.).</td>
      <td>Use the slider at the top left to enable/disable tab view. When enabled, you’ll see tabs for each record type.</td>
    </tr>
    <tr>
      <td><strong>Grid View</strong></td>
      <td>Displays results in a sortable table with columns for date, type, title, location and status.</td>
      <td>Click the “Grid View” button. Column headers can be clicked to sort ascending/descending.</td>
    </tr>
    <tr>
      <td><strong>List View</strong></td>
      <td>Shows results grouped by month, with each item displayed as a card containing title, dates and status badges.</td>
      <td>Click the “List View” button. Each card can be expanded to show more details.</td>
    </tr>
  </tbody>
</table>

<h2>Basic vs Advanced Search</h2>
<p>
  The filter panel can be toggled between <strong>advanced</strong> and <strong>basic</strong>
  modes. Use the “Show basic search” or “Show advanced search” link at the top of the filter box to switch.
</p>

<h3>Advanced Search</h3>
<p>In advanced mode you can filter using multiple criteria:</p>
<ul>
  <li><strong>Keyword search</strong>: enter words to search titles and descriptions.</li>
  <li><strong>Record Type(s)</strong>: multi-select to filter by Meetings, Notifications or Activities.</li>
  <li><strong>Activity Type(s)</strong>: filter by sub‑category of activity.</li>
  <li><strong>GBF Target(s)</strong>: choose one or more Global Biodiversity Framework targets.</li>
  <li><strong>Country(ies)</strong>: restrict results to specific countries.</li>
  <li><strong>Subject(s)</strong>: additional subject filters (on scroll).</li>
  <li><strong>Date range</strong>: pick a start and end date.</li>
  <li><strong>Action required</strong>: show only items requiring action.</li>
  <li><strong>Sort results</strong>: choose the sorting field and direction.</li>
  <li><strong>Clear all filters</strong>: resets all selections.</li>
</ul>

<div class="screenshot">
  <!-- Replace image2.png with the actual screenshot (citation 709893051007533†screenshot) -->
  <img src="/image2.png" alt="Record type selection with 'Meetings' highlighted (citation 709893051007533†screenshot)">
  <div class="caption">Figure&nbsp;2: Selecting record types in advanced mode (citation 709893051007533†screenshot).</div>
</div>

<h3>Basic Search</h3>
<p>
  Basic search provides a simplified set of filters for quick lookups:
</p>
<ul>
  <li><strong>Keyword search</strong>: a single search field.</li>
  <li><strong>Date range</strong>: two date pickers (start and end).</li>
  <li><strong>Action required</strong>: checkbox to show only items requiring action.</li>
  <li><strong>Sort results</strong>: simplified sort selector.</li>
  <li><strong>Clear all filters</strong>.</li>
</ul>

<div class="screenshot">
  <!-- Replace image3.png with the actual screenshot (citation 880098094057165†screenshot) -->
  <img src="/image3.png" alt="Basic search interface with date range and sort fields (citation 880098094057165†screenshot)">
  <div class="caption">Figure&nbsp;3: Basic search mode, showing date range and sort options (citation 880098094057165†screenshot).</div>
</div>

<h2>Using Filters</h2>
<ol>
  <li>Switch to <strong>advanced search</strong> if you need detailed filters.</li>
  <li>Enter <strong>keywords</strong> in the search bar.</li>
  <li>Select <strong>record types</strong> from the drop‑down. Each selected type becomes a tag; click its “×” to remove it.</li>
  <li>Add <strong>activity types</strong>, <strong>GBF targets</strong>, <strong>countries</strong>, or <strong>subjects</strong> as needed.</li>
  <li>Set a <strong>date range</strong> via the date pickers.</li>
  <li>Check the <strong>Action required</strong> box to show only items needing action.</li>
  <li>Use the <strong>Sort results</strong> selector to order by start date, end date, title, etc.</li>
  <li>Click <strong>Clear all filters</strong> to reset everything.</li>
</ol>

<h2>Viewing Results</h2>

<h3>Grid View</h3>
<p>
  Grid view displays results in a table.  Each row shows the date range, record type badge,
  title, location and status.  Clicking the arrow on a row expands detailed information.
</p>

<div class="screenshot">
  <!-- Replace image4.png with the actual screenshot (citation 679432070622477†screenshot or 774051577819342†screenshot) -->
  <img src="/image4.png" alt="Grid view results table (citation 774051577819342†screenshot)">
  <div class="caption">Figure&nbsp;4: Grid view displaying results in a sortable table (citation 774051577819342†screenshot).</div>
</div>

<h3>List View</h3>
<p>
  List view groups activities by month.  Each item is presented as a card with a coloured header
  indicating the record type, along with dates and status badges.  Click the arrow on a card to expand the description.
</p>

<h3>Tab View by Record Type</h3>
<p>
  Enabling “Tab View by Record Type” divides the results area into tabs for each record type (Meetings,
  Notifications, Activities, Peer‑reviews, etc.).  Click the slider to toggle this view; a blue switch indicates
  that tab view is active.
</p>

<div class="screenshot">
  <!-- Replace image5.png with the actual screenshot (citation 41185989711629†screenshot) -->
  <img src="/image5.png" alt="Tab view with record type toggle enabled (citation 41185989711629†screenshot)">
  <div class="caption">Figure&nbsp;5: Tab view enabled (citation 41185989711629†screenshot).</div>
</div>

<h2>Sorting and Clearing Results</h2>
<p>
  You can sort results by start date, end date, title or other fields. The selected sort appears as a tag in the filter panel.
  Remove the tag or click “Clear all filters” to reset sorting.
</p>

<h2>Accessibility and User‑Experience Notes</h2>
<ul>
  <li>Drop‑downs support keyboard navigation; type to search and press Enter to select or deselect options.</li>
  <li>The component is responsive and adapts to different screen sizes.</li>
  <li>Items requiring action are marked with “Action required” badges.</li>
  <li>Toggling between views or search modes does not reset your filters.</li>
</ul>

<h2>Conclusion</h2>
<p>
  The CBD Calendar search component is a versatile tool for discovering activities and actions.
  By combining keyword search, multi‑faceted filters, view toggles and sorting controls, you can
  easily find the events that matter to you.
</p>

</div>
</template>

<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0 auto;
    max-width: 800px;
    padding: 20px;
  }
  h1, h2, h3 {
    color: #2c3e50;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 20px;
  }
  table th, table td {
    border: 1px solid #ccc;
    padding: 8px;
  }
  .screenshot {
    border: 1px solid #ccc;
    margin: 10px 0;
    padding: 5px;
    text-align: center;
  }
  .screenshot img {
    max-width: 100%;
    height: auto;
  }
  .caption {
    font-size: 0.9em;
    color: #555;
  }
</style>