import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import HtmlEditor from './HtmlEditor';
import TextEditor from './TextEditor';
import { EmailTemplate } from '@/types';
import { extractTextFromHTML } from '@/lib/utils';

interface TemplateDetailsFormProps {
  formData: Partial<EmailTemplate>;
  errors: { [key: string]: string };
  tab: string;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleHtmlChange: (code: string) => void;
  setTab: (tab: string) => void;
}

const TemplateDetailsForm: React.FC<TemplateDetailsFormProps> = ({
  formData,
  errors,
  tab,
  handleChange,
  handleHtmlChange,
  setTab,
}) => {
  const generateContent = (): void => {
    const extractedText = extractTextFromHTML(formData.Html);
    const payload = {
      target: {
        name: 'Text',
        value: extractedText,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    handleChange(payload);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="TemplateName">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="TemplateName"
                name="TemplateName"
                value={formData.TemplateName}
                onChange={handleChange}
                className={errors.TemplateName ? 'border-destructive' : ''}
              />
              {errors.TemplateName && (
                <p className="text-sm text-destructive">
                  {errors.TemplateName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="Subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="Subject"
                name="Subject"
                value={formData.Subject}
                onChange={handleChange}
                className={errors.Subject ? 'border-destructive' : ''}
              />
              {errors.Subject && (
                <p className="text-sm text-destructive">{errors.Subject}</p>
              )}
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML Content</TabsTrigger>
              <TabsTrigger value="text">Text Content</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <HtmlEditor
                value={formData.Html || ''}
                onChange={handleHtmlChange}
                error={errors.Html}
              />
            </TabsContent>
            <TabsContent value="text">
              <TextEditor
                value={formData.Text || ''}
                onChange={handleChange}
                generateContent={generateContent}
                error={errors.Text}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateDetailsForm;
