import mongoose from "mongoose";

const parking_facility_schema = new mongoose.Schema(
  {
    basic_info: {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      type: {
        type: String,
        enum: [
          "multi_storey building",
          "underground garage",
          "open_air parking",
          "hydraulic_automated",
          "surface_parking",
          "covered_parking",
          "mechanical_system",
        ],
        required: true,
      },
      ownership: {
        type: String,
        enum: [
          "building_owned",
          "service_purchased",
          "seperate_facility",
          "co_owned",
        ],
        required: true,
      },
    },
    location: {
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
      address: {
        address_line_1: {
          type: String,
          required: true,
        },
        address_line_2: {
          type: String,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        postal_code: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          required: true,
        },
      },
    },
    structure: {
      levels: [
        {
          name: {
            type: String,
            required: true,
          },
          number: {
            type: Number,
          },
          type: {
            type: String,
            enum: ["underground", "above_ground"],
          },
          height_clearance: {
            type: Number,
          },
          surface_type: {
            type: String,
            enum: ["asphalt", "concrete", "gravel", "paved"],
          },
          lighting_type: {
            type: String,
            enum: ["led", "fluorescent", "halogen", "natural"],
          },
          features: {
            has_elevator: {
              type: Boolean,
              default: false,
            },
            has_stairs: {
              type: Boolean,
              default: false,
            },
            vehicle_lift: {
              type: Boolean,
              default: false,
            },
            fire_safety: {
              type: Boolean,
              default: false,
            },
            sprinkler_system: {
              type: Boolean,
              default: false,
            },
          },
          zones: [
            {
              name: {
                type: String,
                required: true,
              },
              code: {
                type: String,
                required: true,
              },
              type: {
                type: String,
                enum: [
                  "general",
                  "reserved",
                  "handicapped",
                  "electric_vehicle",
                ],
              },
              area: {
                type: Number,
                required: true,
              },
              features: {
                has_lighting: {
                  type: Boolean,
                  default: false,
                },
                cctv_cameras: {
                  type: Boolean,
                  default: false,
                },
                weather_protection: {
                  type: Boolean,
                  default: false,
                },
              },
              parking_rows: [
                {
                  name: {
                    type: String,
                    required: true,
                  },
                  code: {
                    type: String,
                    required: true,
                  },
                  parking_orientation: {
                    type: String,
                    enum: ["perpendicular", "angled", "parallel"],
                  },
                  spacing_width: {
                    type: Number,
                    required: true,
                  },
                  aisle_width: {
                    type: Number,
                    required: true,
                  },
                  parking_spaces: [
                    {
                      number: {
                        type: String,
                        required: true,
                      },
                      type: {
                        type: String,
                        enum: [
                          "standard",
                          "compact",
                          "handicapped",
                          "electric_vehicle",
                        ],
                      },
                      width: {
                        type: Number,
                      },
                      length: {
                        type: Number,
                      },
                      height: {
                        type: Number,
                      },
                      features: {
                        covered: {
                          type: Boolean,
                          default: false,
                        },
                        accessible: {
                          type: Boolean,
                          default: false,
                        },
                        ev_charger: {
                          type: Boolean,
                          default: false,
                        },
                      },
                      note: {
                        type: String,
                      },
                      pricing_strategy: {
                        pricing_type: {
                          type: String,
                          enum: ["fixed", "dynamic"],
                        },
                        base_rate: {
                          type: Number,
                        },
                        hourly_rate: {
                          type: Number,
                        },
                        daily_rate: {
                          type: Number,
                        },
                        monthly_rate: {
                          type: Number,
                        },
                        quarterly_rate: {
                          type: Number,
                        },
                        yearly_rate: {
                          type: Number,
                        },
                        dynamic_pricing_factors: {
                          peak_hours: {
                            type: Boolean,
                            default: false,
                          },
                          events: {
                            type: Boolean,
                            default: false,
                          },
                          weather_conditions: {
                            type: Boolean,
                            default: false,
                          },
                          occupancy_rate: {
                            type: Boolean,
                            default: false,
                          },
                          seasonal_demand: {
                            type: Boolean,
                            default: false,
                          },
                          day_of_week: {
                            type: Boolean,
                            default: false,
                          },
                          special_occasions: {
                            type: Boolean,
                            default: false,
                          },
                          local_traffic: {
                            type: Boolean,
                            default: false,
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    opening_hours: {
      operation_24_7: {
        type: Boolean,
      },
      days: [
        {
          day: {
            type: String,
            enum: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
          },
          opening_time: {
            type: String,
          },
          closing_time: {
            type: String,
          },
          enabled: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    access_control: {
      method: {
        type: String,
        enum: [
          "rfid_cards",
          "qr_code",
          "mobile_app",
          "license_plate_recognition",
          "manual_control",
          "biometric_access",
        ],
        required: true,
      },
      security_level: {
        type: String,
        enum: ["low", "medium", "high"],
        required: true,
      },
      number_of_cameras: {
        type: Number,
        required: true,
      },
      features: {
        entry_exit_barriers: {
          type: Boolean,
          default: false,
        },
        security_guard_on_duty: {
          type: Boolean,
          default: false,
        },
        emergency_access_system: {
          type: Boolean,
          default: false,
        },
      },
    },
    amenities_and_parking: {
      electric_charging_stations: {
        type: Boolean,
        default: false,
      },
      valet_parking: {
        type: Boolean,
        default: false,
      },
      car_wash: {
        type: Boolean,
        default: false,
      },
      security_patrol: {
        type: Boolean,
        default: false,
      },
      cctv_monitoring: {
        type: Boolean,
        default: false,
      },
      emergency_call_points: {
        type: Boolean,
        default: false,
      },
      lighting: {
        type: Boolean,
        default: false,
      },
      weather_protection: {
        type: Boolean,
        default: false,
      },
      elevator_access: {
        type: Boolean,
        default: false,
      },
      wheelchair_accessibility: {
        type: Boolean,
        default: false,
      },
      fire_safety_system: {
        type: Boolean,
        default: false,
      },
      ventilation_system: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

const parking_facility_model = mongoose.model(
  "parking_facility",
  parking_facility_schema,
);

export default parking_facility_model;
