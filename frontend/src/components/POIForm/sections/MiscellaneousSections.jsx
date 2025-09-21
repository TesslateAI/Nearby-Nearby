import {
  Stack, SimpleGrid, TextInput, Textarea, Alert, Text, Select,
  Radio, Checkbox, Button, Group, ActionIcon, Divider
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { addLink, removeLink, updateLink } from '../../../utils/fieldHelpers';
import {
  GIFT_CARD_OPTIONS, PAYMENT_METHODS, DISCOUNT_TYPES
} from '../../../utils/constants';
import { getCheckboxGroupProps } from '../constants/helpers';

export function InternalContactSection({ form }) {
  return (
    <Stack>
      <Alert color="blue" variant="light" mb="md">
        This information is for internal use only and will not be displayed publicly
      </Alert>

      <Divider my="md" label="Main Contact" />
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <TextInput
          label="Name"
          placeholder="Contact person name"
          {...form.getInputProps('main_contact_name')}
        />
        <TextInput
          label="Email"
          placeholder="contact@example.com"
          {...form.getInputProps('main_contact_email')}
        />
        <TextInput
          label="Phone"
          placeholder="(555) 123-4567"
          {...form.getInputProps('main_contact_phone')}
        />
      </SimpleGrid>

      <Divider my="md" label="Emergency Contact (Admin Only)" />
      <Alert color="orange" variant="light" mb="md">
        For disaster response coordination - admin access only
      </Alert>

      <Textarea
        label="Off-site Emergency Contact"
        placeholder="Emergency contact information"
        {...form.getInputProps('offsite_emergency_contact')}
      />

      <RichTextEditor
        label="Emergency Protocols"
        placeholder="Emergency procedures and protocols"
        value={form.values.emergency_protocols || ''}
        onChange={(html) => form.setFieldValue('emergency_protocols', html)}
        error={form.errors.emergency_protocols}
        minRows={3}
      />
    </Stack>
  );
}

export function PricingMembershipsSection({ form }) {
  return (
    <Stack>
      <Divider my="md" label="Cost Information" />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Cost"
          placeholder="e.g., $10 or $0-$50 or 0 (for free)"
          {...form.getInputProps('cost')}
        />
        <Select
          label="Gift Cards Available?"
          data={GIFT_CARD_OPTIONS}
          {...form.getInputProps('gift_cards')}
        />
      </SimpleGrid>
      <RichTextEditor
        label="Pricing Details"
        placeholder="Additional pricing info (e.g., Kids under 2 are free)"
        value={form.values.pricing_details || ''}
        onChange={(html) => form.setFieldValue('pricing_details', html)}
        error={form.errors.pricing_details}
        minRows={3}
      />

      <Divider my="md" label="Payment Methods" />
      <Checkbox.Group {...getCheckboxGroupProps(form, 'payment_methods')}>
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {PAYMENT_METHODS.map(method => (
            <Checkbox key={method} value={method} label={method} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <Divider my="md" label="Discounts Offered" />
      <Text size="sm" c="dimmed">
        Do you offer an everyday discount for service members or community members, separate from seasonal or day-specific promotions?
      </Text>
      <Checkbox.Group {...getCheckboxGroupProps(form, 'discounts')}>
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {DISCOUNT_TYPES.map(discount => (
            <Checkbox key={discount} value={discount} label={discount} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <Divider my="md" label="Membership & Pass Details" />
      <RichTextEditor
        label="Membership & Pass Details"
        placeholder="Information about shared passes or membership programs"
        value={form.values.membership_details || ''}
        onChange={(html) => form.setFieldValue('membership_details', html)}
        error={form.errors.membership_details}
        minRows={3}
      />
    </Stack>
  );
}

export function ConnectionsSection({ form, isBusiness, isPark }) {
  return (
    <Stack>
      {isBusiness && (
        <>
          <Alert color="blue" variant="light">
            Connect your business to other POIs where you provide services or sell products
          </Alert>

          <Text size="sm" fw={500}>Service Locations</Text>
          <Text size="xs" c="dimmed">
            Select POIs where this business provides services (e.g., food truck at events)
          </Text>

          <Text size="sm" fw={500} mt="md">Locally Found At</Text>
          <Text size="xs" c="dimmed">
            Select POIs where this business's products are sold
          </Text>
        </>
      )}

      {!isPark && (
        <>
          <Alert color="blue" variant="light">
            Use this section to indicate if this location shares memberships with other parks/trails
          </Alert>

          <RichTextEditor
            label="Membership & Pass Details"
            placeholder="Information about shared passes or membership programs"
            value={form.values.membership_details || ''}
            onChange={(html) => form.setFieldValue('membership_details', html)}
            error={form.errors.membership_details}
            minRows={3}
          />
        </>
      )}

      <RichTextEditor
        label="Camping & Lodging"
        placeholder="Available camping or lodging options"
        value={form.values.camping_lodging || ''}
        onChange={(html) => form.setFieldValue('camping_lodging', html)}
        error={form.errors.camping_lodging}
      />
    </Stack>
  );
}

export function CommunityConnectionsSection({ form }) {
  return (
    <Stack>
      <RichTextEditor
        label="Community Impact"
        placeholder="How does this contribute to the local community?"
        value={form.values.community_impact || ''}
        onChange={(html) => form.setFieldValue('community_impact', html)}
        error={form.errors.community_impact}
        minRows={3}
      />

      <Divider my="md" label="Article Links" />
      {(form.values.article_links || []).map((link, index) => (
        <Group key={index}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Article or blog post URL"
            value={link}
            onChange={(e) => updateLink(form, 'article_links', index, e.target.value)}
          />
          <ActionIcon color="red" onClick={() => removeLink(form, 'article_links', index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => addLink(form, 'article_links', '')}
      >
        Add Article Link
      </Button>
    </Stack>
  );
}

export function CorporateComplianceSection({ form }) {
  return (
    <Stack>
      <Alert color="blue" variant="light" mb="md">
        This information is for internal use only and will not be displayed publicly
      </Alert>

      <RichTextEditor
        label="Corporate Compliance Requirements"
        placeholder="Do you have any corporate compliance requirements we should be aware of? (e.g., required disclaimers, phrasing, or placement restrictions)"
        value={form.values.compliance?.corporate_requirements || ''}
        onChange={(html) => form.setFieldValue('compliance.corporate_requirements', html)}
        error={form.errors['compliance.corporate_requirements']}
        minRows={3}
      />

      <Radio.Group
        label="Are there any restrictions on public comments or community tips being shown on your listing?"
        value={form.values.compliance?.comments_restricted || 'no'}
        onChange={(value) => {
          form.setFieldValue('compliance.comments_restricted', value);
          if (value === 'no') {
            form.setFieldValue('compliance.comments_explanation', '');
          }
        }}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
        </Stack>
      </Radio.Group>

      {form.values.compliance?.comments_restricted === 'yes' && (
        <RichTextEditor
          label="If yes, please explain"
          placeholder="If yes, please explain: And would disabling the comments section on your listing satisfy requirements?"
          value={form.values.compliance?.comments_explanation || ''}
          onChange={(html) => form.setFieldValue('compliance.comments_explanation', html)}
          error={form.errors['compliance.comments_explanation']}
          minRows={3}
        />
      )}

      <Divider my="md" label="Social Media Restrictions" />
      <Text size="sm" fw={500} mb="xs">
        Are there any social media platforms where your business cannot be mentioned or tagged?
      </Text>
      <Checkbox.Group
        value={form.values.compliance?.social_media_restrictions || []}
        onChange={(value) => form.setFieldValue('compliance.social_media_restrictions', value)}
      >
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          <Checkbox value="facebook" label="Facebook" />
          <Checkbox value="instagram" label="Instagram" />
          <Checkbox value="x" label="X (formally Twitter)" />
          <Checkbox value="tiktok" label="TikTok" />
          <Checkbox value="linkedin" label="LinkedIn" />
        </SimpleGrid>
      </Checkbox.Group>

      <RichTextEditor
        label="Other Social Media Restrictions"
        placeholder="Other social media platforms or additional restrictions"
        value={form.values.compliance?.other_social_restrictions || ''}
        onChange={(html) => form.setFieldValue('compliance.other_social_restrictions', html)}
        error={form.errors['compliance.other_social_restrictions']}
        minRows={2}
      />

      <Radio.Group
        label="Do you require pre-approval before we feature or promote your business in any posts, newsletters, or other materials?"
        value={form.values.compliance?.pre_approval_required || 'no'}
        onChange={(value) => {
          form.setFieldValue('compliance.pre_approval_required', value);
          if (value === 'no') {
            form.setFieldValue('compliance.lead_time_details', '');
          }
        }}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
        </Stack>
      </Radio.Group>

      {form.values.compliance?.pre_approval_required === 'yes' && (
        <RichTextEditor
          label="Lead Time and Contact Information"
          placeholder="If yes, how long of a lead time do you need and who do we contact with our post content for submission? (Email - Phone)"
          value={form.values.compliance?.lead_time_details || ''}
          onChange={(html) => form.setFieldValue('compliance.lead_time_details', html)}
          error={form.errors['compliance.lead_time_details']}
          minRows={3}
        />
      )}

      <Radio.Group
        label="Is there any language or branding you are required to use (or avoid) when referring to your business?"
        value={form.values.compliance?.branding_requirements || 'no'}
        onChange={(value) => {
          form.setFieldValue('compliance.branding_requirements', value);
          if (value === 'no') {
            form.setFieldValue('compliance.branding_details', '');
          }
        }}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
        </Stack>
      </Radio.Group>

      {form.values.compliance?.branding_requirements === 'yes' && (
        <RichTextEditor
          label="Branding Guidelines"
          placeholder="If yes, please describe or attach brand guidelines"
          value={form.values.compliance?.branding_details || ''}
          onChange={(html) => form.setFieldValue('compliance.branding_details', html)}
          error={form.errors['compliance.branding_details']}
          minRows={3}
        />
      )}
    </Stack>
  );
}