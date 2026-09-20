async function getRfqSchema(sb) {
  return {
    definitions: {
      rfqs: {
        properties: {
          id: {},
          buyer_id: {},
          company_id: {},
          category_id: {},
          title: {},
          description: {},
          quantity: {},
          capacity: {},
          delivery_country: {},
          delivery_city: {},
          technical_requirements: {},
          deadline: {},
          status: {}
        }
      }
    }
  };
}
