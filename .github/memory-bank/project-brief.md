# Project brief: DexReader

## What it is

DexReader is a manga reader app written in React with TypeScript. It allows user to read manga, bookmarks titles, as well as the ability to download manga titles to enjoy when the user does not have internet access.

## Who is this for

This is a personal app, as such it is tailored solely to the person behind the screen who created the app

## Problem it solves

MangaDex is a great manga resource, powered by the community, that provide the most up-to-date, most translated manga titles out there. However, it has a caveat, the whole service is web only, meaning no apps available anywhere, user would have to go to MangaDex on their web browser to reach the service. Also, there is no offline capabilities, meaning everything is online. DexReader should solve this by providing an easy to use, Desktop friendly version of MangaDex for personal enjoyment

## How it should work?

- Leverage MangaDex API to provide the manga listing
- Allow user to search for, view the latest updates, and bookmark a manga title on their personal library by querying the MangaDex API for listings
- Allow user to read a manga in a book-like interface, and track their reading progress
- Allow user to quickly jump to a last read page of a chapter when opening an unfinished chapter
- Allow user to organise their personal library by sorting bookmarked manga titles into different collection
- Allow user to download a manga chapter, or the whole manga title or offline reading
- Allow user to quickly get up-to-date with their bookmarked titles by checking for new chapter by demand, and/or on app startup
- Allow user to import their manga library from Mihon/Tachiyomi (popular Android manga reader apps)
- Allow user to export their manga library to:
  - Native DexReader backup format (for app restoration)
  - Mihon/Tachiyomi compatible backup file (for cross-platform use)
