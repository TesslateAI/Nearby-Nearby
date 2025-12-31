// Image Integration Module for POIForm
// Images are stored in the Images table with S3 storage
// No longer syncing URLs to POI direct fields - frontend reads from poi.images array

import React from 'react';
import { Stack, Divider, Text } from '@mantine/core';
import { ImageUploadField } from '../ImageUpload/ImageUploadField';

// Featured/Main Image Upload
export const FeaturedImageUpload = ({ poiId, isBusiness, isFreeListing, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="main"
      label={isBusiness && isFreeListing ? "Business Logo" : "Featured Image"}
      description="Upload your main image that will be displayed in listings"
      required={true}
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Gallery Photos Upload
export const GalleryPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="gallery"
      label="Gallery Photos"
      description="Upload multiple photos to showcase your business (up to 20)"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Menu Photos Upload
export const MenuPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="menu"
      label="Menu Photos"
      description="Upload photos of your menu (up to 10)"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Entry Photo Upload
export const EntryPhotoUpload = ({ poiId, poiType, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="entry"
      label={`${poiType} Entry Photos`}
      description="Upload 2-3 photos showing the main entrance and entry area"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Parking Photos Upload
export const ParkingPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="parking"
      label="Parking Lot Photos"
      description="Photos of parking areas (up to 5)"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Restroom Photos with context for multiple restrooms
export const RestroomPhotosUpload = ({ poiId, restroomIndex, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="restroom"
      context={`restroom_${restroomIndex + 1}`}
      label={`Restroom ${restroomIndex + 1} Photos`}
      description="Photos of this restroom location"
      // Images stored in Images table with context - no sync to POI fields needed
    />
  );
};

// Rental Photos Upload
export const RentalPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="rental"
      label="Rental Space Photos"
      description="Photos of rentable spaces or equipment"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Playground Photos Upload
export const PlaygroundPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="playground"
      label="Playground Photos"
      description="Photos of playground areas"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Trail Head Photo Upload
export const TrailHeadPhotoUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="trail_head"
      label="Trail Head Photo"
      description="Photo of the trail starting point"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Trail Exit Photo Upload
export const TrailExitPhotoUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="trail_exit"
      label="Trail Exit Photo"
      description="Photo of the trail ending point"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Downloadable Maps Upload
export const DownloadableMapsUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="downloadable_map"
      label="Downloadable Maps"
      description="Upload maps as PDF or image files (up to 5, max 50MB each)"
      // Images stored in Images table - no sync to POI fields needed
    />
  );
};

// Helper function to determine if we should show image upload or URL input
export const shouldUseImageUpload = (poiId) => {
  // Use image upload if we have a POI ID (editing existing or after initial save)
  // Otherwise use URL inputs for initial creation
  return !!poiId;
};
