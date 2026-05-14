import React from 'react';
import { Alert, Text, Stack } from '@mantine/core';

/**
 * ADA Service Animal disclaimer rendered beneath the Pet Policy field
 * group on every layout that exposes pet_options.
 */
export default function ServiceAnimalAlert() {
  return (
    <Alert variant="light" color="yellow" title="ADA Service Animal Notice">
      <Stack gap={6}>
        <Text size="sm">
          Under the Americans with Disabilities Act (ADA), service animals must
          be admitted to all areas open to the public — even if you select
          "No Pets Allowed." A service animal is a dog (or miniature horse)
          individually trained to perform tasks for a person with a disability.
        </Text>
        <Text size="sm">
          Emotional support, comfort, or therapy animals are <strong>not</strong> classified
          as service animals under the ADA and may be subject to your pet policy.
          Staff may only ask two questions: (1) Is this a service animal required
          because of a disability? (2) What work or task has it been trained to perform?
        </Text>
      </Stack>
    </Alert>
  );
}

export { ServiceAnimalAlert };
