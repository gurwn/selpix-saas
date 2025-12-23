'use client';

import Error from 'next/error';

// This file handles 404 errors at the root level (when no locale match is found)
// Since we removed app/layout.tsx, this file MUST include html/body tags.

export default function GlobalNotFound() {
    return (
        <html lang="en">
            <body>
                <Error statusCode={404} />
            </body>
        </html>
    );
}
