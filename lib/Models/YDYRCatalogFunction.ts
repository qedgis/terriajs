import { action, computed } from "mobx";
import TerriaError from "../Core/TerriaError";
import YDYRCatalogFunctionTraits from "../Traits/YDYRCatalogFunctionTraits";
import CreateModel from "./CreateModel";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import i18next from "i18next";
import CatalogFunctionMixin from "../ModelMixins/CatalogFunctionMixin";
import EnumerationParameter from "./EnumerationParameter";
import CsvCatalogItem from "./CsvCatalogItem";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import TableMixin from "../ModelMixins/TableMixin";
import isDefined from "../Core/isDefined";
import TableColumnType from "../Table/TableColumnType";
import { Model } from "cesium";
import TableTraits from "../Traits/TableTraits";
import { BaseModel } from "./Model";

const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

export const DATASETS = [
  // <file-name>.<data-col>.<geog-name>.<side-data>
  //['STE_2011_AUST.CED_2011.CED_2011.BCP_2011', 'STE 2011'],
  //['STE_2016_AUST.CED_2016.CED_2016.BCP_2016', 'STE 2016'],

  [
    "SA1_2011_AUST.SA1_MAIN11.SA1_2011.BCP_2011",
    "ABS - 2011 Statistical Areas Level 1"
  ],
  [
    "SA2_2011_AUST.SA2_MAIN11.SA2_2011.BCP_2011",
    "ABS - 2011 Statistical Areas Level 2"
  ],
  [
    "SA3_2011_AUST.SA3_CODE11.SA3_2011.BCP_2011",
    "ABS - 2011 Statistical Areas Level 3"
  ],
  [
    "SA4_2011_AUST.SA4_CODE11.SA4_2011.BCP_2011",
    "ABS - 2011 Statistical Areas Level 4"
  ],
  [
    "LGA_2011_AUST.LGA_CODE11.LGA_2011.BCP_2011",
    "ABS - 2011 Local Government Areas"
  ],
  [
    "CED_2011_AUST.CED_CODE11.CED_2011.BCP_2011",
    "ABS - 2011 Commonwealth Electoral Divisions"
  ],
  [
    "SED_2011_AUST.SED_CODE11.SED_2011.BCP_2011",
    "ABS - 2011 State Electoral Divisions"
  ],
  [
    "RA_2011_AUST.RA_CODE11.RA_2011.BCP_2011",
    "ABS - 2011 Remoteness Areas 2011"
  ],
  ["SSC_2011_AUST.SSC_CODE11.SSC_2011.BCP_2011", "ABS - 2011 State Suburbs"],
  ["POA_2011_AUST.POA_CODE.POA_2011.BCP_2011", "ABS - 2011 Postal Areas"],

  [
    "SA1_2016_AUST.SA1_MAIN16.SA1_2016.BCP_2016",
    "ABS - 2016 Statistical Areas Level 1"
  ],
  [
    "SA2_2016_AUST.SA2_MAIN16.SA2_2016.BCP_2016",
    "ABS - 2016 Statistical Areas Level 2"
  ],
  [
    "SA3_2016_AUST.SA3_CODE16.SA3_2016.BCP_2016",
    "ABS - 2016 Statistical Areas Level 3"
  ],
  [
    "SA4_2016_AUST.SA4_CODE16.SA4_2016.BCP_2016",
    "ABS - 2016 Statistical Areas Level 4"
  ],
  [
    "LGA_2016_AUST.LGA_CODE16.LGA_2016.BCP_2016",
    "ABS - 2016 Local Government Areas"
  ],
  [
    "CED_2016_AUST.CED_CODE16.CED_2016.BCP_2016",
    "ABS - 2016 Commonwealth Electoral Divisions"
  ],
  [
    "SED_2016_AUST.SED_CODE16.SED_2016.BCP_2016",
    "ABS - 2016 State Electoral Divisions"
  ],
  ["RA_2016_AUST.RA_CODE16.RA_2016.BCP_2016", "ABS - Remoteness Areas 2016"],
  ["SSC_2016_AUST.SSC_CODE16.SSC_2016.BCP_2016", "ABS - 2016 State Suburbs"],
  ["POA_2016_AUST.POA_CODE16.POA_2016.BCP_2016", "ABS - 2016 Postal Areas"]
];

export const SIDE_DATA = [
  ["BCP_2011", "Basic Community profile 2011"],
  ["BCP_2016", "Basic Community profile 2016"]
];

export const ALGORITHMS = [
  ["Negative Binomial", true],
  ["Population Weighted", false],
  ["Poisson Linear", false],
  ["Ridge Regressor", false]
];

export default class YDYRCatalogFunction extends CatalogFunctionMixin(
  CreateModel(YDYRCatalogFunctionTraits)
) {
  static readonly type = "ydyr";
  readonly typeName = "YourDataYourRegions";

  private _inputLayers?: EnumerationParameter
  private _dataColumn?: EnumerationParameter
  private _regionColumn?: EnumerationParameter

  async forceLoadMetadata() {
    
  }

  @computed
  get selectedTableCatalogMember(): TableMixin.TableMixin | undefined{
    console.log(this.inputLayers);
    if (!isDefined(this.inputLayers?.value)) {
      return
    }
    return this.terria.workbench.items.filter(TableMixin.isMixedInto).filter(item => item.uniqueId === this.inputLayers!.value)[0]
  }

  @computed
  get inputLayers(): FunctionParameter {
    const possibleValues = this.terria.workbench.items.filter(item => TableMixin.isMixedInto(item) && item.activeTableStyle.isRegions()).map(item => item.uniqueId).filter(isDefined)
    this._inputLayers = new EnumerationParameter({
      id: "Input Layer",
      possibleValues ,
      value: this._inputLayers?.possibleValues.includes(this._inputLayers.value) ? this._inputLayers.value : possibleValues[0]
    })
    return this._inputLayers
  }

  @computed
  get regionColumn(): FunctionParameter {
    this._regionColumn = new EnumerationParameter({
      id: "Region Column",
      possibleValues: this.selectedTableCatalogMember?.tableColumns.filter(col => col.type === TableColumnType.region).map(col => col.name) || [],
      value: this._regionColumn?.possibleValues.includes(this._regionColumn.value) ? this._regionColumn.value : undefined
    })
    return this._regionColumn
  }

  @computed
  get dataColumn(): FunctionParameter {
    this._dataColumn = new EnumerationParameter({
      id: "Data Column",
      possibleValues: this.selectedTableCatalogMember?.tableColumns.filter(col => col.type === TableColumnType.scalar).map(col => col.name) || [],
      value: this._dataColumn?.possibleValues.includes(this._dataColumn.value) ? this._dataColumn.value : undefined
    })
    return this._dataColumn
  }

  /**
   *  Maps the input to function parameters.
   *
   * We `keepAlive` because the parameter properties could be modified by
   * UI that can come and go, but we want those modifications to persist.
   */
  @computed({ keepAlive: true })
  get parameters(): FunctionParameter[] {
    return [
      this.inputLayers,
      this.regionColumn,
      this.dataColumn,
      new EnumerationParameter({
        id: "Output Geography",
        possibleValues: DATASETS.map(d => d[1])
      })
    ];
  }

  /**
   * Performs the Execute request for the WPS process
   *
   * If `executeWithHttpGet` is true, a GET request is made
   * instead of the default POST request.
   */
  @action
  async invoke() {}
}

function throwInvalidWpsServerError(
  wps: YDYRCatalogFunction,
  endpoint: string
) {
  throw new TerriaError({
    title: i18next.t("models.YDYR.invalidWPSServerTitle"),
    message: i18next.t("models.YDYR.invalidWPSServerMessage", {
      name: wps.name,
      email:
        '<a href="mailto:' +
        wps.terria.supportEmail +
        '">' +
        wps.terria.supportEmail +
        "</a>.",
      endpoint
    })
  });
}
