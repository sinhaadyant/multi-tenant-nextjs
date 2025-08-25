"use client";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import ComponentCard from "../../common/ComponentCard";
import Input from "../input/InputField";
import Label from "../Label";

export default function InputStates() {
  const { t } = useTranslation('forms');
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);

  // Simulate a validation check
  const validateEmail = (value: string) => {
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setError(!isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };
  return (
    <ComponentCard
      title={t('sections.inputStates')}
      desc={t('sections.inputStatesDesc')}
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Error Input */}
        <div>
          <Label>{t('labels.email')}</Label>
          <Input
            type="email"
            defaultValue={email}
            error={error}
            onChange={handleEmailChange}
            placeholder={t('placeholders.enterEmail')}
            hint={error ? t('states.invalidEmail') : ""}
          />
        </div>

        {/* Success Input */}
        <div>
          <Label>{t('labels.email')}</Label>
          <Input
            type="email"
            defaultValue={email}
            success={!error}
            onChange={handleEmailChange}
            placeholder={t('placeholders.enterEmail')}
            hint={!error ? t('states.validEmail') : ""}
          />
        </div>

        {/* Disabled Input */}
        <div>
          <Label>{t('labels.email')}</Label>
          <Input
            type="text"
            defaultValue={t('placeholders.disabledEmail')}
            disabled={true}
            placeholder={t('placeholders.disabledEmail')}
            hint={t('states.fieldDisabled')}
          />
        </div>
      </div>
    </ComponentCard>
  );
}
