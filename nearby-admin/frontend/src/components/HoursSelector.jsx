import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  Stack, Group, Text, Button, Select, Switch, ActionIcon,
  Checkbox, Divider, Card, Badge, Tabs, Alert, TextInput,
  SegmentedControl, Collapse, SimpleGrid, NumberInput,
  Tooltip, MultiSelect, Modal, CloseButton
} from '@mantine/core';
import { TimeInput, DatePickerInput } from '@mantine/dates';
import {
  IconPlus, IconTrash, IconCopy, IconSun, IconMoon,
  IconCalendar, IconClock, IconAlertCircle, IconSnowflake,
  IconFlower, IconLeaf, IconSunHigh, IconRepeat
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

// Ordinal week options for recurring exceptions
const ORDINAL_OPTIONS = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' },
  { value: 'third', label: 'Third' },
  { value: 'fourth', label: 'Fourth' },
  { value: 'last', label: 'Last' }
];

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

// Common holiday definitions
const COMMON_HOLIDAYS = [
  { value: 'new_year', label: "New Year's Day", date: '01-01' },
  { value: 'mlk_day', label: 'Martin Luther King Jr. Day', date: 'third_monday_january' },
  { value: 'presidents_day', label: "Presidents' Day", date: 'third_monday_february' },
  { value: 'memorial_day', label: 'Memorial Day', date: 'last_monday_may' },
  { value: 'juneteenth', label: 'Juneteenth', date: '06-19' },
  { value: 'independence_day', label: 'Independence Day', date: '07-04' },
  { value: 'labor_day', label: 'Labor Day', date: 'first_monday_september' },
  { value: 'columbus_day', label: 'Columbus Day', date: 'second_monday_october' },
  { value: 'veterans_day', label: "Veterans Day", date: '11-11' },
  { value: 'thanksgiving', label: 'Thanksgiving', date: 'fourth_thursday_november' },
  { value: 'black_friday', label: 'Black Friday', date: 'day_after_thanksgiving' },
  { value: 'christmas_eve', label: 'Christmas Eve', date: '12-24' },
  { value: 'christmas', label: 'Christmas Day', date: '12-25' },
  { value: 'new_year_eve', label: "New Year's Eve", date: '12-31' },
  { value: 'easter', label: 'Easter Sunday', date: 'easter_calculation' },
  { value: 'good_friday', label: 'Good Friday', date: 'two_days_before_easter' },
  { value: 'mothers_day', label: "Mother's Day", date: 'second_sunday_may' },
  { value: 'fathers_day', label: "Father's Day", date: 'third_sunday_june' },
  { value: 'halloween', label: 'Halloween', date: '10-31' },
  { value: 'valentines_day', label: "Valentine's Day", date: '02-14' }
];

const SEASON_DEFINITIONS = [
  { value: 'spring', label: 'Spring', icon: IconFlower, months: [3, 4, 5], color: 'green' },
  { value: 'summer', label: 'Summer', icon: IconSunHigh, months: [6, 7, 8], color: 'yellow' },
  { value: 'fall', label: 'Fall/Autumn', icon: IconLeaf, months: [9, 10, 11], color: 'orange' },
  { value: 'winter', label: 'Winter', icon: IconSnowflake, months: [12, 1, 2], color: 'blue' }
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' }
];

const TIME_TYPES = [
  { value: 'fixed', label: 'Fixed Time' },
  { value: 'dawn', label: 'Dawn/Sunrise' },
  { value: 'dusk', label: 'Dusk/Sunset' },
  { value: 'appointment', label: 'By Appointment' },
  { value: 'call', label: 'Call for Hours' }
];

// Component for a single time period (handles multiple periods per day)
function TimePeriod({ period, onChange, onRemove, showRemove }) {
  const handleTimeTypeChange = (field, type) => {
    if (type === 'dawn' || type === 'dusk') {
      onChange({
        ...period,
        [field]: { type, offset: 0 }
      });
    } else if (type === 'appointment' || type === 'call') {
      onChange({
        ...period,
        [field]: { type }
      });
    } else {
      onChange({
        ...period,
        [field]: { type: 'fixed', time: field === 'open' ? '09:00' : '17:00' }
      });
    }
  };

  const getTimeValue = (timeData) => {
    if (!timeData) return '';
    if (timeData.type === 'fixed') return timeData.time || '';
    if (timeData.type === 'dawn' || timeData.type === 'dusk') {
      const offsetStr = timeData.offset > 0 ? `+${timeData.offset}` : timeData.offset || '0';
      return `${timeData.type} ${offsetStr} min`;
    }
    return timeData.type;
  };

  return (
    <Group>
      <Select
        size="xs"
        w={120}
        data={TIME_TYPES}
        value={period.open?.type || 'fixed'}
        onChange={(value) => handleTimeTypeChange('open', value)}
      />
      
      {period.open?.type === 'fixed' && (
        <TimeInput
          size="xs"
          w={100}
          value={period.open?.time || '09:00'}
          onChange={(event) => onChange({
            ...period,
            open: { type: 'fixed', time: event.target.value }
          })}
        />
      )}
      
      {(period.open?.type === 'dawn' || period.open?.type === 'dusk') && (
        <Group gap={5}>
          <NumberInput
            size="xs"
            w={80}
            value={period.open?.offset || 0}
            onChange={(value) => onChange({
              ...period,
              open: { ...period.open, offset: value }
            })}
            suffix=" min"
            step={15}
          />
          <Tooltip label={`Minutes ${period.open?.offset >= 0 ? 'after' : 'before'} ${period.open?.type}`}>
            <IconAlertCircle size={16} />
          </Tooltip>
        </Group>
      )}

      <Text size="sm">to</Text>

      <Select
        size="xs"
        w={120}
        data={TIME_TYPES}
        value={period.close?.type || 'fixed'}
        onChange={(value) => handleTimeTypeChange('close', value)}
      />
      
      {period.close?.type === 'fixed' && (
        <TimeInput
          size="xs"
          w={100}
          value={period.close?.time || '17:00'}
          onChange={(event) => onChange({
            ...period,
            close: { type: 'fixed', time: event.target.value }
          })}
        />
      )}
      
      {(period.close?.type === 'dawn' || period.close?.type === 'dusk') && (
        <Group gap={5}>
          <NumberInput
            size="xs"
            w={80}
            value={period.close?.offset || 0}
            onChange={(value) => onChange({
              ...period,
              close: { ...period.close, offset: value }
            })}
            suffix=" min"
            step={15}
          />
          <Tooltip label={`Minutes ${period.close?.offset >= 0 ? 'after' : 'before'} ${period.close?.type}`}>
            <IconAlertCircle size={16} />
          </Tooltip>
        </Group>
      )}

      {period.note && (
        <TextInput
          size="xs"
          placeholder="Note (e.g., 'Kitchen closes at 9pm')"
          value={period.note}
          onChange={(e) => onChange({ ...period, note: e.target.value })}
          w={200}
        />
      )}

      {showRemove && (
        <ActionIcon color="red" size="sm" onClick={onRemove}>
          <IconTrash size={16} />
        </ActionIcon>
      )}
    </Group>
  );
}

// Component for daily hours
function DayHours({ day, hours, onChange, onCopy }) {
  // Initialize with default open status if not set
  const initialHours = hours || {
    status: 'open',
    periods: [{ 
      open: { type: 'fixed', time: '09:00' }, 
      close: { type: 'fixed', time: '17:00' } 
    }]
  };
  
  const [isOpen, setIsOpen] = useState(initialHours.status === 'open');
  const [showDetails, setShowDetails] = useState(false);

  const handleStatusChange = (status) => {
    setIsOpen(status === 'open');
    if (status === 'closed') {
      onChange({ status: 'closed' });
    } else if (status === '24hours') {
      onChange({ status: '24hours' });
    } else if (status === 'appointment') {
      onChange({
        status: 'appointment',
        periods: [{
          open: { type: 'appointment' },
          close: { type: 'appointment' }
        }]
      });
    } else {
      onChange({
        status: 'open',
        periods: initialHours.periods || [{
          open: { type: 'fixed', time: '09:00' },
          close: { type: 'fixed', time: '17:00' }
        }]
      });
    }
  };

  const addPeriod = () => {
    const newPeriods = [...(initialHours.periods || []), {
      open: { type: 'fixed', time: '09:00' },
      close: { type: 'fixed', time: '17:00' }
    }];
    onChange({ ...initialHours, periods: newPeriods });
  };

  const updatePeriod = (index, period) => {
    const newPeriods = [...(initialHours.periods || [])];
    newPeriods[index] = period;
    onChange({ ...initialHours, periods: newPeriods });
  };

  const removePeriod = (index) => {
    const newPeriods = initialHours.periods?.filter((_, i) => i !== index) || [];
    onChange({ ...initialHours, periods: newPeriods });
  };

  return (
    <Card p="sm" withBorder>
      <Group justify="space-between" mb="xs">
        <Group>
          <Text fw={500}>{day.label}</Text>
          <SegmentedControl
            size="xs"
            value={initialHours.status}
            onChange={handleStatusChange}
            data={[
              { label: 'Open', value: 'open' },
              { label: 'Closed', value: 'closed' },
              { label: '24 Hours', value: '24hours' },
              { label: 'By Appt', value: 'appointment' }
            ]}
          />
        </Group>
        <Group>
          <Tooltip label="Copy hours to other days">
            <ActionIcon size="sm" variant="subtle" onClick={onCopy}>
              <IconCopy size={16} />
            </ActionIcon>
          </Tooltip>
          {initialHours.status === 'open' && (
            <Switch
              size="xs"
              label="Multiple periods"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.currentTarget.checked)}
            />
          )}
        </Group>
      </Group>

      {initialHours.status === 'open' && (
        <Stack gap="xs">
          {initialHours.periods?.map((period, index) => (
            <TimePeriod
              key={index}
              period={period}
              onChange={(p) => updatePeriod(index, p)}
              onRemove={() => removePeriod(index)}
              showRemove={initialHours.periods.length > 1}
            />
          ))}
          
          {showDetails && (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={addPeriod}
            >
              Add time period (e.g., lunch break)
            </Button>
          )}
        </Stack>
      )}
    </Card>
  );
}

// Main HoursSelector component - memoized to prevent unnecessary re-renders
const HoursSelector = memo(({ value = {}, onChange, poiType }) => {
  const [activeTab, setActiveTab] = useState('regular');
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySource, setCopySource] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  
  // Initialize with default structure and default hours for each day
  const getDefaultDayHours = () => ({
    status: 'open',
    periods: [{ 
      open: { type: 'fixed', time: '09:00' }, 
      close: { type: 'fixed', time: '17:00' } 
    }]
  });
  
  const defaultRegular = {};
  DAYS_OF_WEEK.forEach(day => {
    defaultRegular[day.value] = (value?.regular && value.regular[day.value]) || getDefaultDayHours();
  });
  
  const hours = {
    regular: defaultRegular,
    seasonal: value.seasonal || {},
    holidays: value.holidays || {},
    exceptions: value.exceptions || [],
    timezone: value.timezone || 'America/New_York',
    notes: value.notes || ''
  };

  const updateHours = (updates) => {
    onChange({ ...hours, ...updates });
  };

  // Copy hours from one day to others
  const handleCopyHours = (sourceDay) => {
    setCopySource(sourceDay);
    setSelectedDays([]);
    setCopyModalOpen(true);
  };

  const applyCopyHours = () => {
    if (!copySource || selectedDays.length === 0) return;
    
    const sourceHours = hours.regular[copySource];
    const newRegular = { ...hours.regular };
    
    selectedDays.forEach(day => {
      newRegular[day] = { ...sourceHours };
    });
    
    updateHours({ regular: newRegular });
    setCopyModalOpen(false);
    notifications.show({
      title: 'Hours copied',
      message: `Hours from ${copySource} copied to selected days`,
      color: 'green'
    });
  };

  // Add seasonal hours
  const addSeasonalHours = (season) => {
    const newSeasonal = {
      ...hours.seasonal,
      [season]: {
        ...DAYS_OF_WEEK.reduce((acc, day) => ({
          ...acc,
          [day.value]: { status: 'open', periods: [{ 
            open: { type: 'fixed', time: '09:00' }, 
            close: { type: 'fixed', time: '17:00' } 
          }] }
        }), {})
      }
    };
    updateHours({ seasonal: newSeasonal });
  };

  // Add holiday hours
  const addHolidayHours = (holidayId) => {
    const holiday = COMMON_HOLIDAYS.find(h => h.value === holidayId);
    if (!holiday) return;
    
    const newHolidays = {
      ...hours.holidays,
      [holidayId]: {
        name: holiday.label,
        date: holiday.date,
        status: 'closed',
        periods: []
      }
    };
    updateHours({ holidays: newHolidays });
  };

  // Add exception date (one-time)
  const addException = () => {
    const newExceptions = [
      ...hours.exceptions,
      {
        type: 'one-time',
        date: new Date().toISOString().split('T')[0],
        status: 'closed',
        reason: '',
        periods: []
      }
    ];
    updateHours({ exceptions: newExceptions });
  };

  // Add recurring exception (e.g., "closed every 3rd Wednesday")
  const addRecurringException = () => {
    const newExceptions = [
      ...hours.exceptions,
      {
        type: 'recurring',
        pattern: {
          ordinal: 'first',
          dayOfWeek: 'wednesday',
          months: [] // empty = all months
        },
        status: 'closed',
        reason: '',
        periods: []
      }
    ];
    updateHours({ exceptions: newExceptions });
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="sm" fw={500}>Business Hours</Text>
        <Select
          size="xs"
          w={200}
          label="Timezone"
          value={hours.timezone}
          onChange={(value) => updateHours({ timezone: value })}
          data={[
            { value: 'America/New_York', label: 'Eastern Time' },
            { value: 'America/Chicago', label: 'Central Time' },
            { value: 'America/Denver', label: 'Mountain Time' },
            { value: 'America/Phoenix', label: 'Arizona Time' },
            { value: 'America/Los_Angeles', label: 'Pacific Time' },
            { value: 'America/Anchorage', label: 'Alaska Time' },
            { value: 'Pacific/Honolulu', label: 'Hawaii Time' }
          ]}
        />
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="regular" leftSection={<IconClock size={14} />}>
            Regular Hours
          </Tabs.Tab>
          <Tabs.Tab value="seasonal" leftSection={<IconCalendar size={14} />}>
            Seasonal Hours
          </Tabs.Tab>
          <Tabs.Tab value="holidays" leftSection={<IconCalendar size={14} />}>
            Holiday Hours
          </Tabs.Tab>
          <Tabs.Tab value="exceptions" leftSection={<IconAlertCircle size={14} />}>
            Exceptions
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="regular" pt="md">
          <Stack>
            <Alert color="blue" variant="light">
              Set your standard operating hours. You can add multiple time periods per day for breaks.
            </Alert>
            
            {DAYS_OF_WEEK.map(day => (
              <DayHours
                key={day.value}
                day={day}
                hours={hours.regular[day.value]}
                onChange={(dayHours) => updateHours({
                  regular: { ...hours.regular, [day.value]: dayHours }
                })}
                onCopy={() => handleCopyHours(day.value)}
              />
            ))}

            <Group>
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  const defaultHours = {
                    status: 'open',
                    periods: [{ 
                      open: { type: 'fixed', time: '09:00' }, 
                      close: { type: 'fixed', time: '17:00' } 
                    }]
                  };
                  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                  const newRegular = { ...hours.regular };
                  weekdays.forEach(day => {
                    newRegular[day] = defaultHours;
                  });
                  updateHours({ regular: newRegular });
                }}
              >
                Set Mon-Fri: 9am-5pm
              </Button>
              
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  const newRegular = {};
                  DAYS_OF_WEEK.forEach(day => {
                    newRegular[day.value] = { status: '24hours' };
                  });
                  updateHours({ regular: newRegular });
                }}
              >
                Set 24/7
              </Button>

              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  const appointmentHours = {
                    status: 'appointment',
                    periods: [{
                      open: { type: 'appointment' },
                      close: { type: 'appointment' }
                    }]
                  };
                  const newRegular = {};
                  DAYS_OF_WEEK.forEach(day => {
                    newRegular[day.value] = appointmentHours;
                  });
                  updateHours({ regular: newRegular });
                }}
              >
                By Appointment Only
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="seasonal" pt="md">
          <Stack>
            <Alert color="blue" variant="light">
              Override regular hours during specific seasons or date ranges. Seasonal hours take precedence over regular hours.
              You can use predefined seasons OR specify exact date ranges (e.g., "Summer hours: June 1 - Aug 15").
            </Alert>

            <SimpleGrid cols={2}>
              {SEASON_DEFINITIONS.map(season => {
                const SeasonIcon = season.icon;
                const hasHours = hours.seasonal[season.value];

                return (
                  <Card key={season.value} withBorder p="sm">
                    <Group justify="space-between" mb="xs">
                      <Group>
                        <SeasonIcon size={20} color={`var(--mantine-color-${season.color}-6)`} />
                        <Text fw={500}>{season.label}</Text>
                      </Group>
                      {!hasHours ? (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => addSeasonalHours(season.value)}
                        >
                          Add Hours
                        </Button>
                      ) : (
                        <ActionIcon
                          color="red"
                          size="sm"
                          onClick={() => {
                            const newSeasonal = { ...hours.seasonal };
                            delete newSeasonal[season.value];
                            updateHours({ seasonal: newSeasonal });
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>

                    {hasHours && (
                      <Text size="xs" c="dimmed">
                        Custom hours set for {season.label}
                      </Text>
                    )}
                  </Card>
                );
              })}
            </SimpleGrid>

            {Object.entries(hours.seasonal).map(([season, seasonHours]) => {
              const seasonDef = SEASON_DEFINITIONS.find(s => s.value === season);
              if (!seasonDef) return null;

              return (
                <Collapse key={season} in={true}>
                  <Stack>
                    <Divider label={`${seasonDef.label} Hours`} />

                    {/* Date range controls for seasonal hours */}
                    <Card withBorder p="sm" bg="gray.0">
                      <Group mb="xs">
                        <Switch
                          size="xs"
                          label="Use specific date range instead of default season dates"
                          checked={seasonHours.useDateRange || false}
                          onChange={(e) => updateHours({
                            seasonal: {
                              ...hours.seasonal,
                              [season]: {
                                ...seasonHours,
                                useDateRange: e.currentTarget.checked
                              }
                            }
                          })}
                        />
                      </Group>

                      {seasonHours.useDateRange ? (
                        <Group>
                          <DatePickerInput
                            size="xs"
                            label="Start date"
                            placeholder="Pick start date"
                            value={seasonHours.startDate ? new Date(seasonHours.startDate) : null}
                            onChange={(date) => updateHours({
                              seasonal: {
                                ...hours.seasonal,
                                [season]: {
                                  ...seasonHours,
                                  startDate: date ? date.toISOString().split('T')[0] : null
                                }
                              }
                            })}
                            w={150}
                          />
                          <DatePickerInput
                            size="xs"
                            label="End date"
                            placeholder="Pick end date"
                            value={seasonHours.endDate ? new Date(seasonHours.endDate) : null}
                            onChange={(date) => updateHours({
                              seasonal: {
                                ...hours.seasonal,
                                [season]: {
                                  ...seasonHours,
                                  endDate: date ? date.toISOString().split('T')[0] : null
                                }
                              }
                            })}
                            w={150}
                          />
                          <Text size="xs" c="dimmed" mt={20}>
                            (Repeats annually)
                          </Text>
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">
                          Using default {seasonDef.label} months: {seasonDef.months.map(m => MONTHS.find(mo => mo.value === String(m))?.label).join(', ')}
                        </Text>
                      )}
                    </Card>

                    {DAYS_OF_WEEK.map(day => (
                      <DayHours
                        key={`${season}-${day.value}`}
                        day={day}
                        hours={seasonHours[day.value]}
                        onChange={(dayHours) => updateHours({
                          seasonal: {
                            ...hours.seasonal,
                            [season]: {
                              ...seasonHours,
                              [day.value]: dayHours
                            }
                          }
                        })}
                        onCopy={() => {}}
                      />
                    ))}
                  </Stack>
                </Collapse>
              );
            })}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="holidays" pt="md">
          <Stack>
            <Alert color="blue" variant="light">
              Set special hours for holidays. These override both regular and seasonal hours.
            </Alert>
            
            <MultiSelect
              label="Add holiday hours"
              placeholder="Select holidays"
              data={COMMON_HOLIDAYS.filter(h => !hours.holidays[h.value])}
              onChange={(values) => {
                values.forEach(value => {
                  if (!hours.holidays[value]) {
                    addHolidayHours(value);
                  }
                });
              }}
            />
            
            <Stack>
              {Object.entries(hours.holidays).map(([holidayId, holiday]) => (
                <Card key={holidayId} withBorder p="sm">
                  <Group justify="space-between" mb="xs">
                    <Group>
                      <Text fw={500}>{holiday.name}</Text>
                      <Badge size="sm" variant="light">
                        {holiday.date}
                      </Badge>
                    </Group>
                    <Group>
                      <SegmentedControl
                        size="xs"
                        value={holiday.status}
                        onChange={(status) => updateHours({
                          holidays: {
                            ...hours.holidays,
                            [holidayId]: { ...holiday, status }
                          }
                        })}
                        data={[
                          { label: 'Open', value: 'open' },
                          { label: 'Closed', value: 'closed' },
                          { label: 'Modified', value: 'modified' }
                        ]}
                      />
                      <ActionIcon
                        color="red"
                        size="sm"
                        onClick={() => {
                          const newHolidays = { ...hours.holidays };
                          delete newHolidays[holidayId];
                          updateHours({ holidays: newHolidays });
                        }}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  
                  {holiday.status === 'modified' && (
                    <Stack gap="xs">
                      {(holiday.periods || [{ 
                        open: { type: 'fixed', time: '10:00' }, 
                        close: { type: 'fixed', time: '16:00' } 
                      }]).map((period, index) => (
                        <TimePeriod
                          key={index}
                          period={period}
                          onChange={(p) => {
                            const newPeriods = [...(holiday.periods || [])];
                            newPeriods[index] = p;
                            updateHours({
                              holidays: {
                                ...hours.holidays,
                                [holidayId]: { ...holiday, periods: newPeriods }
                              }
                            });
                          }}
                          onRemove={() => {
                            const newPeriods = holiday.periods.filter((_, i) => i !== index);
                            updateHours({
                              holidays: {
                                ...hours.holidays,
                                [holidayId]: { ...holiday, periods: newPeriods }
                              }
                            });
                          }}
                          showRemove={holiday.periods?.length > 1}
                        />
                      ))}
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => {
                          const newPeriods = [
                            ...(holiday.periods || []),
                            { 
                              open: { type: 'fixed', time: '10:00' }, 
                              close: { type: 'fixed', time: '16:00' } 
                            }
                          ];
                          updateHours({
                            holidays: {
                              ...hours.holidays,
                              [holidayId]: { ...holiday, periods: newPeriods }
                            }
                          });
                        }}
                      >
                        Add time period
                      </Button>
                    </Stack>
                  )}
                </Card>
              ))}
            </Stack>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="exceptions" pt="md">
          <Stack>
            <Alert color="blue" variant="light">
              Add exceptions for specific dates or recurring patterns (e.g., "closed every 3rd Wednesday").
              Exceptions take highest priority and override all other hours settings.
            </Alert>

            <Group>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={addException}
              >
                Add One-Time Exception
              </Button>
              <Button
                variant="light"
                color="violet"
                leftSection={<IconRepeat size={16} />}
                onClick={addRecurringException}
              >
                Add Recurring Exception
              </Button>
            </Group>

            {hours.exceptions.map((exception, index) => (
              <Card key={index} withBorder p="sm">
                {/* One-time exception */}
                {(!exception.type || exception.type === 'one-time') && (
                  <>
                    <Group justify="space-between" mb="xs">
                      <Group>
                        <Badge size="sm" variant="light" color="blue">One-time</Badge>
                        <input
                          type="date"
                          value={exception.date}
                          onChange={(e) => {
                            const newExceptions = [...hours.exceptions];
                            newExceptions[index] = { ...exception, type: 'one-time', date: e.target.value };
                            updateHours({ exceptions: newExceptions });
                          }}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ced4da' }}
                        />
                        <SegmentedControl
                          size="xs"
                          value={exception.status}
                          onChange={(status) => {
                            const newExceptions = [...hours.exceptions];
                            newExceptions[index] = { ...exception, status };
                            updateHours({ exceptions: newExceptions });
                          }}
                          data={[
                            { label: 'Open', value: 'open' },
                            { label: 'Closed', value: 'closed' },
                            { label: 'Modified', value: 'modified' }
                          ]}
                        />
                      </Group>
                      <ActionIcon
                        color="red"
                        size="sm"
                        onClick={() => {
                          const newExceptions = hours.exceptions.filter((_, i) => i !== index);
                          updateHours({ exceptions: newExceptions });
                        }}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>

                    <TextInput
                      size="xs"
                      placeholder="Reason for exception (e.g., 'Staff training day')"
                      value={exception.reason || ''}
                      onChange={(e) => {
                        const newExceptions = [...hours.exceptions];
                        newExceptions[index] = { ...exception, reason: e.target.value };
                        updateHours({ exceptions: newExceptions });
                      }}
                    />
                  </>
                )}

                {/* Recurring exception */}
                {exception.type === 'recurring' && (
                  <>
                    <Group justify="space-between" mb="xs">
                      <Group>
                        <Badge size="sm" variant="light" color="violet">
                          <Group gap={4}>
                            <IconRepeat size={12} />
                            Recurring
                          </Group>
                        </Badge>
                        <Select
                          size="xs"
                          w={100}
                          value={exception.pattern?.ordinal || 'first'}
                          onChange={(ordinal) => {
                            const newExceptions = [...hours.exceptions];
                            newExceptions[index] = {
                              ...exception,
                              pattern: { ...exception.pattern, ordinal }
                            };
                            updateHours({ exceptions: newExceptions });
                          }}
                          data={ORDINAL_OPTIONS}
                        />
                        <Select
                          size="xs"
                          w={130}
                          value={exception.pattern?.dayOfWeek || 'wednesday'}
                          onChange={(dayOfWeek) => {
                            const newExceptions = [...hours.exceptions];
                            newExceptions[index] = {
                              ...exception,
                              pattern: { ...exception.pattern, dayOfWeek }
                            };
                            updateHours({ exceptions: newExceptions });
                          }}
                          data={DAYS_OF_WEEK}
                        />
                        <Text size="xs" c="dimmed">of</Text>
                        <MultiSelect
                          size="xs"
                          w={200}
                          placeholder="All months"
                          value={exception.pattern?.months || []}
                          onChange={(months) => {
                            const newExceptions = [...hours.exceptions];
                            newExceptions[index] = {
                              ...exception,
                              pattern: { ...exception.pattern, months }
                            };
                            updateHours({ exceptions: newExceptions });
                          }}
                          data={MONTHS}
                          clearable
                        />
                      </Group>
                      <ActionIcon
                        color="red"
                        size="sm"
                        onClick={() => {
                          const newExceptions = hours.exceptions.filter((_, i) => i !== index);
                          updateHours({ exceptions: newExceptions });
                        }}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>

                    <Group mb="xs">
                      <SegmentedControl
                        size="xs"
                        value={exception.status}
                        onChange={(status) => {
                          const newExceptions = [...hours.exceptions];
                          newExceptions[index] = { ...exception, status };
                          updateHours({ exceptions: newExceptions });
                        }}
                        data={[
                          { label: 'Open', value: 'open' },
                          { label: 'Closed', value: 'closed' },
                          { label: 'Modified Hours', value: 'modified' }
                        ]}
                      />
                    </Group>

                    <TextInput
                      size="xs"
                      placeholder="Reason (e.g., 'Staff meeting day')"
                      value={exception.reason || ''}
                      onChange={(e) => {
                        const newExceptions = [...hours.exceptions];
                        newExceptions[index] = { ...exception, reason: e.target.value };
                        updateHours({ exceptions: newExceptions });
                      }}
                    />

                    <Text size="xs" c="dimmed" mt="xs">
                      {exception.pattern?.months?.length > 0
                        ? `Every ${exception.pattern?.ordinal} ${DAYS_OF_WEEK.find(d => d.value === exception.pattern?.dayOfWeek)?.label} of ${exception.pattern.months.map(m => MONTHS.find(mo => mo.value === m)?.label).join(', ')}`
                        : `Every ${exception.pattern?.ordinal} ${DAYS_OF_WEEK.find(d => d.value === exception.pattern?.dayOfWeek)?.label} of every month`
                      }
                    </Text>
                  </>
                )}

                {/* Modified hours periods (shared by both types) */}
                {exception.status === 'modified' && (
                  <Stack gap="xs" mt="xs">
                    {(exception.periods || [{
                      open: { type: 'fixed', time: '10:00' },
                      close: { type: 'fixed', time: '16:00' }
                    }]).map((period, periodIndex) => (
                      <TimePeriod
                        key={periodIndex}
                        period={period}
                        onChange={(p) => {
                          const newExceptions = [...hours.exceptions];
                          const newPeriods = [...(exception.periods || [])];
                          newPeriods[periodIndex] = p;
                          newExceptions[index] = { ...exception, periods: newPeriods };
                          updateHours({ exceptions: newExceptions });
                        }}
                        onRemove={() => {
                          const newExceptions = [...hours.exceptions];
                          const newPeriods = exception.periods.filter((_, i) => i !== periodIndex);
                          newExceptions[index] = { ...exception, periods: newPeriods };
                          updateHours({ exceptions: newExceptions });
                        }}
                        showRemove={exception.periods?.length > 1}
                      />
                    ))}
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => {
                        const newExceptions = [...hours.exceptions];
                        const newPeriods = [
                          ...(exception.periods || []),
                          { open: { type: 'fixed', time: '10:00' }, close: { type: 'fixed', time: '16:00' } }
                        ];
                        newExceptions[index] = { ...exception, periods: newPeriods };
                        updateHours({ exceptions: newExceptions });
                      }}
                    >
                      Add time period
                    </Button>
                  </Stack>
                )}
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Divider my="md" />
      
      <TextInput
        label="General Hours Notes"
        placeholder="e.g., 'Kitchen closes 1 hour before closing time'"
        value={hours.notes}
        onChange={(e) => updateHours({ notes: e.target.value })}
      />

      {/* Copy Hours Modal */}
      <Modal
        opened={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title={`Copy hours from ${copySource}`}
      >
        <Stack>
          <Text size="sm">Select days to copy hours to:</Text>
          <Checkbox.Group value={selectedDays} onChange={setSelectedDays}>
            <Stack>
              {DAYS_OF_WEEK.filter(d => d.value !== copySource).map(day => (
                <Checkbox key={day.value} value={day.value} label={day.label} />
              ))}
            </Stack>
          </Checkbox.Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCopyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyCopyHours} disabled={selectedDays.length === 0}>
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
});

HoursSelector.displayName = 'HoursSelector';

export default HoursSelector;