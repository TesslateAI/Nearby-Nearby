import React from 'react';
import { Alert, Text } from '@mantine/core';

/**
 * ADA Service Animal disclaimer rendered beneath the Pet Policy field
 * group on every layout that exposes pet_options.
 */
export default function ServiceAnimalAlert() {
  return (
    <Alert variant="light" color="blue" title="Service Animals">
      <Text size="sm">
        Under the Americans with Disabilities Act (ADA), service animals are
        permitted in all areas where members of the public are allowed to go,
        regardless of the venue's general pet policy. A service animal is a
        dog (or in some cases a miniature horse) individually trained to
        perform work or tasks for a person with a disability. Emotional
        support, comfort, or therapy animals are not classified as service
        animals under the ADA.
      </Text>
    </Alert>
  );
}

export { ServiceAnimalAlert };
