import { describe, it, expect } from 'vitest';
import {
  validateAccessibleParking,
  ACCESSIBLE_PARKING_OPTION,
  ACCESSIBLE_PARKING_MESSAGE,
} from '../validationRules';

const ADA = 'Dedicated accessible parking spaces on site';

describe('validateAccessibleParking', () => {
  it('passes when Accessible Parking is not selected (flat)', () => {
    expect(validateAccessibleParking({ parking_types: ['Garage'] })).toEqual({});
  });

  it('passes on empty / undefined values', () => {
    expect(validateAccessibleParking({})).toEqual({});
    expect(validateAccessibleParking(undefined)).toEqual({});
  });

  it('flags flat Accessible Parking with no ADA detail (Business Free / legacy)', () => {
    const errors = validateAccessibleParking({
      parking_types: [ACCESSIBLE_PARKING_OPTION],
      accessible_parking_details: [],
    });
    expect(errors).toEqual({ accessible_parking_details: ACCESSIBLE_PARKING_MESSAGE });
  });

  it('passes flat Accessible Parking once an ADA detail is chosen', () => {
    expect(
      validateAccessibleParking({
        parking_types: [ACCESSIBLE_PARKING_OPTION],
        accessible_parking_details: [ADA],
      }),
    ).toEqual({});
  });

  it('flags a per-row parking_locations grouping with no ADA detail', () => {
    const errors = validateAccessibleParking({
      parking_locations: [
        { parking_types: ['Garage'], accessible_parking_details: [] },
        { parking_types: [ACCESSIBLE_PARKING_OPTION], accessible_parking_details: [] },
      ],
    });
    expect(errors).toEqual({
      'parking_locations.1.accessible_parking_details': ACCESSIBLE_PARKING_MESSAGE,
    });
  });

  it('passes a per-row grouping once its ADA detail is chosen', () => {
    expect(
      validateAccessibleParking({
        parking_locations: [
          { parking_types: [ACCESSIBLE_PARKING_OPTION], accessible_parking_details: [ADA] },
        ],
      }),
    ).toEqual({});
  });

  it('flags both flat and per-row violations at once', () => {
    const errors = validateAccessibleParking({
      parking_types: [ACCESSIBLE_PARKING_OPTION],
      accessible_parking_details: [],
      parking_locations: [
        { parking_types: [ACCESSIBLE_PARKING_OPTION], accessible_parking_details: [] },
      ],
    });
    expect(errors).toEqual({
      accessible_parking_details: ACCESSIBLE_PARKING_MESSAGE,
      'parking_locations.0.accessible_parking_details': ACCESSIBLE_PARKING_MESSAGE,
    });
  });
});
