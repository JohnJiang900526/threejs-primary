import { Vector3 } from "three";

export interface JointItemType {
  middlePosition: number
  name: string
  sid: string
  static: boolean
  type: string
  zeroPosition : number,
  axis: Vector3,
  limits: {
    min: number,
    max: number
  }
}

export type JointsType = {[key: string]: JointItemType}

export interface KinematicsType {
  getJointValue: (index: string) => number | undefined
  setJointValue: (index: string, val: number) => void,
  joints: JointsType
}


