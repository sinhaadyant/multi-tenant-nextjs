"use client";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import ComponentCard from "../../common/ComponentCard";
import TextArea from "../input/TextArea";
import Label from "../Label";

export default function TextAreaInput() {
  const { t } = useTranslation('forms');
  const [message, setMessage] = useState("");
  const [messageTwo, setMessageTwo] = useState("");
  return (
    <ComponentCard title={t('sections.textareaInputField')}>
      <div className="space-y-6">
        {/* Default TextArea */}
        <div>
          <Label>{t('labels.description')}</Label>
          <TextArea
            value={message}
            onChange={(value) => setMessage(value)}
            rows={6}
          />
        </div>

        {/* Disabled TextArea */}
        <div>
          <Label>{t('labels.description')}</Label>
          <TextArea rows={6} disabled />
        </div>

        {/* Error TextArea */}
        <div>
          <Label>{t('labels.description')}</Label>
          <TextArea
            rows={6}
            value={messageTwo}
            error
            onChange={(value) => setMessageTwo(value)}
            hint={t('states.pleaseEnterValidMessage')}
          />
        </div>
      </div>
    </ComponentCard>
  );
}
