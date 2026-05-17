import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';

dotenv.config();

const swaggerAutogenInstance = swaggerAutogen();

const doc = {
    info: {
        title: 'E-Commerce API',
        description: 'RESTful API for an e-commerce platform',
        version: '1.0.0',
    },

    host: `localhost:${process.env.PORT || 5000}`,

    basePath: '/api/v1',

    schemes: ['http'],

    consumes: ['application/json'],
    produces: ['application/json'],

    tags: [
        {
            name: 'Auth',
            description: 'Authentication endpoints',
        },

        {
            name: 'Products',
            description: 'Product management',
        },

        {
            name: 'Categories',
            description: 'Category management',
        },

        {
            name: 'Cart',
            description: 'Shopping cart operations',
        },

        {
            name: 'Addresses',
            description: 'Address management',
        },

        {
            name: 'Orders',
            description: 'Order management',
        },
    ],

    securityDefinitions: {
        BearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'Enter JWT token as: Bearer <token>',
        },
    },
};

const outputFile = './swagger.json';

const endpointsFiles = [
    './src/app.js',
    './src/routes/authRoutes.js',
    './src/routes/productRoute.js',
    './src/routes/categoryRoute.js',
    './src/routes/cartRoutes.js',
    './src/routes/addressRoutes.js',
    './src/routes/orderRoutes.js',
];

swaggerAutogenInstance(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger documentation generated');
});