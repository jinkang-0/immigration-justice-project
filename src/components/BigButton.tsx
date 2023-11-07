import styled from 'styled-components';
import COLORS from '@/styles/colors';

const BigButton = styled.button<{ $color?: string }>`
  background-color: ${props => props.color || COLORS.blueMid};
  color: ${props => props.$color};
  padding: 0.94rem 11.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
`;

export default BigButton;

/**
  'use client';

  import React from 'react';
  import BigButton from '@/components/BigButton';

  export default function ButtonTest() {
    return (
      <BigButton
        color="yellow"
        onClick={() => {
          console.error('hi!');
        }}
      >
        Big Button
      </BigButton>
    );
  }
 */