/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fireEvent } from '@testing-library/react';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Provider } from 'react-redux';

import { wrapWithForm } from '../../../../test_utils';
import { getMockAuthStore } from '../../test_utils';
import { AddAuthUserPayload } from '../../types';
import { SignInMethod, SignInMethodProps } from './SignInMethod';

describe('SignInMethod', () => {
  const validEmail = 'pir@j.k';
  const validPassword = 'pelmeni';

  async function setup(defaultValues: Partial<AddAuthUserPayload>) {
    const store = getMockAuthStore();
    const methods = wrapWithForm(
      (props: SignInMethodProps & UseFormReturn<AddAuthUserPayload>) => (
        <Provider store={store}>
          <SignInMethod {...props} />
        </Provider>
      ),
      { defaultValues },
      { isEditing: false }
    );

    const email = methods.getByLabelText('Email');

    fireEvent.change(email, {
      target: { value: 'just need to make this dirty' },
    });

    await methods.triggerValidation();

    fireEvent.change(email, {
      target: { value: defaultValues.email },
    });

    fireEvent.blur(email);

    await methods.triggerValidation();
    return methods;
  }

  describe('requiring at least one value', () => {
    const errorText = /One method is required./;

    it('is valid when phoneNumber present', async () => {
      const { queryByText } = await setup({
        email: '',
        password: '',
        phoneNumber: '+1 689 689 6899',
      });
      expect(queryByText(errorText)).toBeNull();
    });

    it('is valid when email and valid password are present', async () => {
      const { queryByText } = await setup({
        email: validEmail,
        password: validPassword,
        phoneNumber: '',
      });
      expect(queryByText(errorText)).toBeNull();
    });

    it('is valid when everything is present', async () => {
      const { queryByText } = await setup({
        email: validEmail,
        password: validPassword,
        phoneNumber: '+1 689 689 6899',
      });
      expect(queryByText(errorText)).toBeNull();
    });

    it('does not show error, if any other error is present', async () => {
      const { queryByText } = await setup({
        email: validEmail,
        password: '',
        phoneNumber: '+1 689 689 6899',
      });
      expect(queryByText(errorText)).toBeNull();
    });

    it('shows error, if nothing is present', async () => {
      const { getByText } = await setup({
        email: '',
        password: '',
        phoneNumber: '',
      });

      expect(getByText(errorText)).not.toBeNull();
    });
  });
});
