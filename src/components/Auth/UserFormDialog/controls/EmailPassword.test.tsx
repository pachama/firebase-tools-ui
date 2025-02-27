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

import React from 'react';

import { wrapWithForm } from '../../../../test_utils';
import { AddAuthUserPayload } from '../../types';
import { EmailPassword, EmailPasswordProps } from './EmailPassword';

describe('EmailPassword', () => {
  const validEmail = 'pir@j.k';

  function setup(
    defaultValues: Partial<AddAuthUserPayload>,
    props: EmailPasswordProps = {
      allEmails: new Set(),
      editedUserEmail: undefined,
      isEditing: false,
    }
  ) {
    return wrapWithForm(EmailPassword, { defaultValues }, props);
  }

  describe('requiring both values or none', () => {
    const errorText = 'Both email and password should be present';

    it('is valid when both empty', () => {
      const { queryByText } = setup({ email: '', password: '' });
      expect(queryByText(errorText)).toBeNull();
    });

    it('is valid when both present', () => {
      const { queryByText } = setup({ email: validEmail, password: 'pelmeni' });
      expect(queryByText(errorText)).toBeNull();
    });

    it('is invalid if just password is present', async () => {
      const { getByText, triggerValidation } = setup({
        email: '',
        password: 'pelmeni',
      });
      await triggerValidation();
      expect(getByText(errorText)).not.toBeNull();
    });

    it('is invalid if just email is present', async () => {
      const { getByText, triggerValidation } = setup({
        email: validEmail,
        password: '',
      });
      await triggerValidation();
      getByText(errorText);
    });

    it('is valid if just email is present in editing mode', () => {
      const { queryByText } = setup(
        { email: validEmail, password: '' },
        {
          allEmails: new Set(),
          editedUserEmail: undefined,
          isEditing: true,
        }
      );
      expect(queryByText(errorText)).toBeNull();
    });
  });

  describe('email validation', () => {
    const errorText = 'Invalid email';

    it('valid for valid email', () => {
      const { queryByText } = setup({ email: validEmail, password: 'pelmeni' });
      expect(queryByText(errorText)).toBeNull();
    });

    it('invalid for invalid email', async () => {
      const { queryByText, triggerValidation } = setup({
        email: 'pirojok',
        password: 'lol',
      });
      await triggerValidation();
      expect(queryByText(errorText)).not.toBeNull();
    });

    it('invalid for duplicate email', async () => {
      const { getByText, triggerValidation } = setup(
        {
          email: validEmail,
          password: 'lollol',
        },
        { allEmails: new Set([validEmail]), isEditing: false }
      );
      await triggerValidation();
      expect(getByText('User with this email already exists')).not.toBeNull();
    });

    it('valid for email that is being edited', async () => {
      const { queryByText, triggerValidation } = setup(
        {
          email: validEmail,
          password: 'lollol',
        },
        {
          allEmails: new Set([validEmail]),
          editedUserEmail: validEmail,
          isEditing: true,
        }
      );
      await triggerValidation();
      expect(queryByText('User with this email already exists')).toBeNull();
    });
  });

  describe('password validation', () => {
    const errorText = /Password should be at least/;

    it('valid for password longer than 6 characters', () => {
      const { queryByText } = setup({
        email: validEmail,
        password: 'suchlong',
      });
      expect(queryByText(errorText)).toBeNull();
    });

    it('invalid for invalid password', async () => {
      const { queryByText, triggerValidation } = setup({
        email: validEmail,
        password: 'short',
      });
      await triggerValidation();
      expect(queryByText(errorText)).not.toBeNull();
      expect(queryByText('Invalid email')).toBeNull();
    });
  });
});
