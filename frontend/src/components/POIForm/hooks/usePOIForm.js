import { useMemo } from 'react';
import { useForm } from '@mantine/form';
import { emptyInitialValues } from '../constants/initialValues';
import { getValidationRules } from '../constants/validationRules';

export const usePOIForm = () => {
  const form = useForm({
    initialValues: emptyInitialValues,
    validate: getValidationRules()
  });

  // Memoize computed values to prevent unnecessary recalculations
  const computedValues = useMemo(() => {
    const isBusiness = form.values.poi_type === 'BUSINESS';
    const isPark = form.values.poi_type === 'PARK';
    const isTrail = form.values.poi_type === 'TRAIL';
    const isEvent = form.values.poi_type === 'EVENT';
    const isPaidListing = isBusiness && ['paid', 'paid_founding', 'sponsor', 'community_comped'].includes(form.values.listing_type);
    const isFreeListing = form.values.listing_type === 'free';

    return {
      isBusiness,
      isPark,
      isTrail,
      isEvent,
      isPaidListing,
      isFreeListing
    };
  }, [form.values.poi_type, form.values.listing_type]);

  return {
    form,
    ...computedValues
  };
};