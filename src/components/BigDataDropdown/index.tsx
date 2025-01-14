'use client';

import { useCallback, useId, useMemo, useRef } from 'react';
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate';
import {
  GroupBase,
  InputActionMeta,
  MultiValue,
  SelectInstance,
  SingleValue,
} from 'react-select';
import { DropdownOption } from '@/types/dropdown';
import { DropdownStyles, DropdownWrapper } from '../InputDropdown/styles';
import { ErrorText, InputLabel } from '../TextInput/styles';
import { AnimatedMenu, NoOptionsMessage } from '../InputDropdown';

// for map: key is actual data stored, value is displayed
interface CommonProps {
  options: Set<string> | Map<string, string>;
  label: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  pageSize?: number;
}

interface MultiSelectProps extends CommonProps {
  multi: true;
  defaultValue?: Set<string>;
  onChange?: (value: Set<string>) => void;
}

interface SingleSelectProps extends CommonProps {
  multi?: false;
  defaultValue?: string;
  onChange?: (value: string | null) => void;
}

type BigDataDropdownProps = SingleSelectProps | MultiSelectProps;

// future improvement: create a custom react-select component
// then use that for BigDataDropdown and InputDropdown
// to reduce repeated code
// related: https://github.com/vtaits/react-select-async-paginate/tree/master/packages/react-select-async-paginate#replacing-components

export default function BigDataDropdown({
  options,
  label,
  placeholder = '',
  error = '',
  defaultValue,
  disabled,
  required,
  multi,
  pageSize = 10,
  onChange,
}: BigDataDropdownProps) {
  const ref =
    useRef<SelectInstance<DropdownOption, false, GroupBase<DropdownOption>>>(
      null,
    );

  const defaultDropdownVal = useMemo(() => {
    if (!defaultValue) return undefined;

    if (defaultValue instanceof Set)
      return Array.from(defaultValue).map(dv => {
        const v = options instanceof Map ? options.get(dv) : dv;
        if (!v) throw new Error(`Value ${dv} not found in options`);
        return {
          label: v,
          value: dv,
        };
      });

    const v = options instanceof Map ? options.get(defaultValue) : defaultValue;
    if (!v) throw new Error(`Value ${v} not found in options`);

    return {
      label: v,
      value: defaultValue,
    };
  }, [defaultValue, options]);

  const optionsArray = useMemo(
    () =>
      options instanceof Set
        ? Array.from(options).map(v => ({ label: v, value: v }))
        : Array.from(options.entries()).map(([k, v]) => ({
            value: k,
            label: v,
          })),
    [options],
  );

  const handleChange = useCallback(
    (newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>) => {
      if (multi && newValue instanceof Array) {
        onChange?.(new Set(newValue.map(v => v.value)));
      } else if (!multi && !(newValue instanceof Array)) {
        onChange?.(newValue ? newValue.value : null);
      } else {
        throw new Error('An unexpected error occurred!');
      }
    },
    [multi, onChange],
  );

  const loadOptions: LoadOptions<
    DropdownOption,
    GroupBase<DropdownOption>,
    null
  > = useCallback(
    async (search, prevOptions) => {
      const searchLower = search.toLowerCase();
      const filteredOptions = search
        ? optionsArray.filter(o => o.label.toLowerCase().includes(searchLower))
        : optionsArray;
      const hasMore = filteredOptions.length > prevOptions.length + pageSize;
      const slicedOptions = filteredOptions.slice(
        prevOptions.length,
        prevOptions.length + pageSize,
      );
      return {
        options: slicedOptions,
        hasMore,
      };
    },
    [optionsArray, pageSize],
  );

  const handleInputChange = useCallback(
    (nv: string, meta: InputActionMeta) => {
      if (meta.action !== 'input-change') return;

      if (ref.current && ref.current.menuListRef)
        ref.current.menuListRef.scrollTop = 0;
    },
    [ref],
  );

  return (
    <DropdownWrapper>
      <InputLabel>{label}</InputLabel>
      <AsyncPaginate
        selectRef={ref}
        components={{ Menu: AnimatedMenu }}
        isClearable
        closeMenuOnSelect={false}
        tabSelectsValue={false}
        hideSelectedOptions={false}
        defaultValue={defaultDropdownVal}
        noOptionsMessage={NoOptionsMessage}
        required={required}
        isDisabled={disabled}
        unstyled
        styles={DropdownStyles(multi, error !== '')}
        instanceId={useId()}
        placeholder={placeholder}
        isMulti={multi}
        onChange={handleChange}
        onInputChange={handleInputChange}
        loadOptions={loadOptions}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </DropdownWrapper>
  );
}

/**
 * EXAMPLE USAGE:
 * 
 * app/test/page.tsx

'use client';

import BigDataDropdown from '@/components/BigDataDropdown';
import COLORS from '@/styles/colors';
import { P } from '@/styles/text';
import React, { useState } from 'react';
import styled from 'styled-components';
import { iso6393 } from 'iso-639-3';
import { City, Country, State } from 'country-state-city';

const langs = new Set(
  iso6393
    .filter(i => i.type === 'living')
    .filter(i => i.iso6392T || i.name.endsWith('Sign Language'))
    .map(i => `${i.name}`)
    .sort((l1, l2) => l1.localeCompare(l2)),
);

const cities = new Set(
  City.getAllCities()
    .sort((c1, c2) => c1.countryCode.localeCompare(c2.countryCode))
    .map(
      c =>
        `${c.name}, ${
          State.getStateByCodeAndCountry(c.stateCode, c.countryCode)?.name
        }, ${Country.getCountryByCode(c.countryCode)?.name}`,
    ),
);

const Container = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100vh;
  padding-top: 8rem;
  padding-bottom: 45rem;
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 4rem;
  border: 2px solid ${COLORS.blueMid};
  border-radius: 0.5rem;
  margin: auto;
  width: 31.25rem;
`;

export default function Page() {
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  return (
    <Container>
      <Box>
        <P>Langs: {Array.from(selectedLangs).join(', ')}</P>
        <P>City: {selectedCity || ''}</P>
        <BigDataDropdown
          label="Languages"
          multi
          options={langs}
          onChange={nv => setSelectedLangs(nv)}
        />
        <BigDataDropdown
          label="City"
          options={cities}
          onChange={nv => setSelectedCity(nv)}
        />
      </Box>
    </Container>
  );
}

 */
