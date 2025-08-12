// netlify/functions/blendlabs-proxy.js
// This file acts as a serverless proxy to bypass CORS restrictions.

exports.handler = async (event, context) => {
    try {
        const { method, loanId, tenant, blendProduct, token, body } = JSON.parse(event.body);

        // Construct the full URL for the Blend API
        const apiUrl = `https://api.blendlabs.com/configurable/applications/${loanId}?includeRelations=true`;

        // Configure headers for the API request
        const headers = {
            'Accept': 'application/json; charset=utf-8',
            'Content-Type': 'application/json',
            'blend-api-version': '5.3.0',
            'blend-target-instance': tenant,
            'cache-control': 'no-cache',
            'blend-product': blendProduct,
            'blend-product-api-version': '1.0.0',
            'Authorization': `Bearer ${token}`,
            // We do not need to set the Cookie header here as it is not strictly required.
            // 'Cookie': 'device-id=s%3A6dc66de5-e784-47fb-becb-18fa18055f89.bgMRISOsyMctJlFtl%2B5QdDddf39k37XKcqSbo3RRJCM'
        };

        // Prepare the options for the fetch call
        const fetchOptions = {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined, // Only include body for PATCH requests
        };

        // Make the request to the actual Blend API
        const response = await fetch(apiUrl, fetchOptions);

        // Check if the API response was successful
        if (!response.ok) {
            const errorText = await response.text();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `API Error: ${errorText}` }),
            };
        }

        const data = await response.json();

        // Return the API response to the client
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Serverless function error: ${error.message}` }),
        };
    }
};
