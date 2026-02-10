export const getBaseDomain = () => {
    const host = window.location.hostname;

    // Handle localhost and IP addresses
    if (host === "localhost" || host === "127.0.0.1" || host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return host;
    }

    // Handle subdomains on localhost (e.g., creator.localhost)
    if (host.endsWith(".localhost")) {
        return "localhost";
    }

    // Production domain logic
    // You can also use a more robust regex or library here, but for this project:
    if (host.endsWith("heroestix.com")) {
        return "heroestix.com";
    }

    return host;
};

export const getSubdomainUrl = (sub, path = "") => {
    const { protocol, port } = window.location;
    const baseDomain = getBaseDomain();
    const portStr = port ? `:${port}` : "";

    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (!sub) {
        return `${protocol}//${baseDomain}${portStr}${normalizedPath}`;
    }

    return `${protocol}//${sub}.${baseDomain}${portStr}${normalizedPath}`;
};
