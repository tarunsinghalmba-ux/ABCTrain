import React from 'react';
import { CircleAlert as AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 leading-relaxed">
              <strong>Compliance Notice:</strong> This platform facilitates access to free external training resources.
              Agency administrators are responsible for verifying that training completions meet current Texas HCSSA
              requirements under 26 TAC Chapter 558. Regulations are subject to change — consult Texas HHS at{' '}
              <a
                href="https://hhs.texas.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-700 font-medium"
              >
                hhs.texas.gov
              </a>
              {' '}for current standards.
            </p>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} PAS Training Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
