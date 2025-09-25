// Image Integration Module for POIForm
// This file shows how to integrate ImageUploadField into POIForm sections

import React from 'react';
import { Stack, Divider, Text } from '@mantine/core';
import { ImageUploadField } from '../ImageUpload/ImageUploadField';

// Replace the featured_image TextInput with this component
export const FeaturedImageUpload = ({ poiId, isBusiness, isFreeListing, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="main"
      label={isBusiness && isFreeListing ? "Business Logo" : "Featured Image"}
      description="Upload your main image that will be displayed in listings"
      required={true}
      onImagesChange={(images) => {
        // Update form with the first image URL
        if (images && images.length > 0) {
          form.setFieldValue('featured_image', images[0].url);
        }
      }}
    />
  );
};

// Replace the gallery_photos TextInput with this component
export const GalleryPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="gallery"
      label="Gallery Photos"
      description="Upload multiple photos to showcase your business (up to 20)"
      onImagesChange={(images) => {
        // Update form with gallery image URLs
        const urls = images.map(img => img.url);
        form.setFieldValue('gallery_photos', urls);
      }}
    />
  );
};

// Replace menu_photos TextInput with this component
export const MenuPhotosUpload = ({ poiId, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="menu"
      label="Menu Photos"
      description="Upload photos of your menu (up to 10)"
      onImagesChange={(images) => {
        const urls = images.map(img => img.url);
        form.setFieldValue('menu_photos', urls);
      }}
    />
  );
};

// Entry Photo Upload
export const EntryPhotoUpload = ({ poiId, poiType, form }) => {
  return (
    <ImageUploadField
      poiId={poiId}
      imageType="entry"
      label={`${poiType} Entry Photo`}
      description="Photo showing the main entrance"
      onImagesChange={(images) => {
        if (images && images.length > 0) {
          form.setFieldValue('business_entry_photo', images[0].url);
        }
      }}
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
      onImagesChange={(images) => {
        const urls = images.map(img => img.url);
        form.setFieldValue('parking_photos', urls);
      }}
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
      onImagesChange={(images) => {
        // Update the specific restroom's photos
        const toilets = form.values.toilets || [];
        if (toilets[restroomIndex]) {
          const urls = images.map(img => img.url).join(', ');
          toilets[restroomIndex].photos = urls;
          form.setFieldValue('toilets', [...toilets]);
        }
      }}
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
      onImagesChange={(images) => {
        const urls = images.map(img => img.url);
        form.setFieldValue('rental_photos', urls);
      }}
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
      onImagesChange={(images) => {
        const urls = images.map(img => img.url);
        form.setFieldValue('playground_photos', urls);
      }}
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
      onImagesChange={(images) => {
        if (images && images.length > 0) {
          form.setFieldValue('trail_head_photo', images[0].url);
        }
      }}
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
      onImagesChange={(images) => {
        if (images && images.length > 0) {
          form.setFieldValue('trail_exit_photo', images[0].url);
        }
      }}
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
      onImagesChange={(images) => {
        // Create structured map data
        const maps = images.map((img, index) => ({
          name: img.caption || `Map ${index + 1}`,
          url: img.url
        }));
        form.setFieldValue('downloadable_maps', maps);
      }}
    />
  );
};

// Helper function to determine if we should show image upload or URL input
export const shouldUseImageUpload = (poiId) => {
  // Use image upload if we have a POI ID (editing existing or after initial save)
  // Otherwise use URL inputs for initial creation
  return !!poiId;
};

// Example integration into POIForm:
/*
// At the top of POIForm.jsx:
import {
  FeaturedImageUpload,
  GalleryPhotosUpload,
  MenuPhotosUpload,
  shouldUseImageUpload
} from './POIForm/ImageIntegration';

// In the Core Information section, replace the featured_image TextInput:
{shouldUseImageUpload(id) ? (
  <FeaturedImageUpload
    poiId={id}
    isBusiness={isBusiness}
    isFreeListing={isFreeListing}
    form={form}
  />
) : (
  <TextInput
    label={isBusiness && isFreeListing ? "Logo" : "Featured Image"}
    placeholder={isBusiness && isFreeListing ? "URL to business logo" : "URL to featured image"}
    {...form.getInputProps('featured_image')}
    description="Image upload will be available shortly..."
  />
)}

// In the Gallery section:
{shouldUseImageUpload(id) ? (
  <GalleryPhotosUpload poiId={id} form={form} />
) : (
  <TextInput
    label="Gallery Photos"
    placeholder="URLs to extra photos (comma-separated)"
    {...form.getInputProps('gallery_photos')}
    description="Image upload will be available shortly..."
  />
)}
*/