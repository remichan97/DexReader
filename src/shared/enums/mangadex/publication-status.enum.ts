export enum PublicationStatus {
  Ongoing = 'ongoing',
  Completed = 'completed',
  Hiatus = 'hiatus',
  Cancelled = 'cancelled' // Note: Cancelled = Publication Cancelled (by author, or by publisher, or both), Axed (by publisher), should not be used as a synonym for "Completed". It is a separate status that indicates the manga was discontinued before completion.
}
