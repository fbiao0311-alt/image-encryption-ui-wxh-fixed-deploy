import os
import math
import time
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
RESULTS_DIR = OUTPUT_DIR / "results"
IMAGES_DIR = OUTPUT_DIR / "images"
ACF_IMAGES_DIR = OUTPUT_DIR / "acf_images"
ACF_DATA_DIR = OUTPUT_DIR / "acf_data"

OUTPUT_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)
ACF_IMAGES_DIR.mkdir(exist_ok=True)
ACF_DATA_DIR.mkdir(exist_ok=True)


# 为 Render 免费版设置安全上限
MAX_HEATMAP_BITS = 65536        # 热图最多使用 65536 bit，也就是 256 x 256
MAX_ACF_BITS = 50000            # ACF 最多使用前 50000 bit
MAX_ACF_LAG = 1024              # ACF 最多计算 1024 个 lag


def clean_bitstream(raw_text: str) -> str:
    return ''.join(c for c in raw_text if c in '01')


def read_bits_from_file(bitstream_file: str) -> str:
    with open(bitstream_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    return clean_bitstream(content)


def analyze_randomness_from_text(raw_text: str):
    bits = clean_bitstream(raw_text)
    total_bits = len(bits)

    if total_bits == 0:
        return {
            "success": False,
            "message": "没有检测到有效的 0/1 比特流",
            "data": None
        }

    count_1 = bits.count('1')
    count_0 = total_bits - count_1

    p_1 = count_1 / total_bits
    p_0 = count_0 / total_bits

    entropy = 0
    if p_1 > 0:
        entropy -= p_1 * math.log2(p_1)
    if p_0 > 0:
        entropy -= p_0 * math.log2(p_0)

    return {
        "success": True,
        "message": "检测完成",
        "data": {
            "entropy": round(entropy, 6),
            "total_bits": total_bits,
            "count_0": count_0,
            "count_1": count_1,
            "p_0": round(p_0, 6),
            "p_1": round(p_1, 6),
            "ratio_text": f"{p_0 * 100:.2f}% / {p_1 * 100:.2f}%"
        }
    }


def calculate_bitstream_entropy(bitstream_file, n=None):
    if not Path(bitstream_file).exists():
        print(f"Error: File {bitstream_file} does not exist")
        return None

    try:
        bits = read_bits_from_file(bitstream_file)

        if n is not None:
            bits = bits[:n]

        if len(bits) == 0:
            return None

        count_1 = bits.count('1')
        count_0 = len(bits) - count_1

        p_1 = count_1 / len(bits)
        p_0 = count_0 / len(bits)

        entropy = 0
        if p_1 > 0:
            entropy -= p_1 * math.log2(p_1)
        if p_0 > 0:
            entropy -= p_0 * math.log2(p_0)

        return {
            'file_name': os.path.basename(bitstream_file),
            'entropy': entropy,
            'p_1': p_1,
            'p_0': p_0,
            'count_1': count_1,
            'count_0': count_0,
            'total_bits': len(bits)
        }

    except Exception as e:
        print(f"Error processing file {bitstream_file}: {e}")
        return None


def save_single_entropy_result(result, output_path, n):
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("Bitstream Shannon Entropy Analysis Results\n")
        f.write("=" * 60 + "\n\n")

        f.write("[Calculation Principle]\n")
        f.write("Information entropy formula: H = -Σ p(i) * log₂(p(i))\n")
        f.write("Where i is 0 or 1.\n\n")

        f.write("[File Analysis Results]\n")
        f.write("=" * 60 + "\n\n")

        f.write(f"File name: {result['file_name']}\n")
        f.write(f"Processed bits: {result['total_bits']}\n")
        f.write(f"Number of 1s: {result['count_1']}\n")
        f.write(f"Number of 0s: {result['count_0']}\n")
        f.write(f"Probability of 1 p(1): {result['p_1']:.6f}\n")
        f.write(f"Probability of 0 p(0): {result['p_0']:.6f}\n")
        f.write(f"Shannon entropy: {result['entropy']:.6f} bits\n\n")

        f.write("[Overall Statistics]\n")
        f.write(f"Bits processed: {n}\n")
        f.write("Theoretical maximum entropy: 1.0 bits when p(0)=p(1)=0.5\n")

    print(f"Entropy analysis results saved to: {output_path}")


def generate_bitstream_visualization(bitstream_file, output_image_path, n=MAX_HEATMAP_BITS):
    if not Path(bitstream_file).exists():
        print(f"Error: File {bitstream_file} does not exist")
        return None

    try:
        bits_full = read_bits_from_file(bitstream_file)

        if len(bits_full) == 0:
            return None

        bits = bits_full[:min(n, len(bits_full))]

        side_length = int(math.sqrt(len(bits)))
        side_length = max(1, side_length)

        draw_bits = side_length * side_length
        bits = bits[:draw_bits]

        rows = side_length
        cols = side_length

        count_1 = bits.count('1')
        count_0 = len(bits) - count_1
        p_1 = count_1 / len(bits) if len(bits) > 0 else 0
        p_0 = count_0 / len(bits) if len(bits) > 0 else 0

        entropy = 0
        if p_1 > 0:
            entropy -= p_1 * math.log2(p_1)
        if p_0 > 0:
            entropy -= p_0 * math.log2(p_0)

        bit_array = np.fromiter((1 if c == '1' else 0 for c in bits), dtype=np.uint8)
        grid_data = bit_array.reshape((rows, cols))

        output_dir = os.path.dirname(output_image_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        plt.figure(figsize=(8, 8), dpi=150)
        ax = plt.gca()
        ax.imshow(grid_data, cmap='binary', aspect='equal', interpolation='nearest')
        ax.invert_yaxis()

        plt.title(
            f'Shannon entropy = {entropy:.6f}  P(1)={p_1 * 100:.2f}%',
            fontsize=12,
            pad=12
        )

        plt.xticks(fontsize=8)
        plt.yticks(fontsize=8)
        plt.grid(alpha=0.2, color='gray', linestyle='-', linewidth=0.3)

        plt.tight_layout()
        plt.savefig(output_image_path, dpi=150, bbox_inches='tight')
        plt.close()

        print(f"Bitstream visualization heatmap saved to: {output_image_path}")

        return {
            'file_name': os.path.basename(bitstream_file),
            'entropy': entropy,
            'p_1': p_1,
            'p_0': p_0,
            'count_1': count_1,
            'count_0': count_0,
            'total_bits': len(bits),
            'rows': rows,
            'cols': cols
        }

    except Exception as e:
        print(f"Error generating bitstream visualization: {e}")
        return None


def calculate_acf_limited(bit_data, max_lag):
    """
    适合 Render 免费版的 ACF 计算。
    只计算有限 bit 和有限 lag，避免 1Mb 文件导致后端连接重置。
    """
    bit_data = np.asarray(bit_data, dtype=np.float64)

    N = len(bit_data)
    if N < 2:
        return None, None

    mu = np.mean(bit_data)
    sigma = np.std(bit_data)

    if sigma == 0:
        lags = np.arange(0, min(max_lag, N - 1) + 1)
        acf_values = np.zeros_like(lags, dtype=np.float64)
        acf_values[0] = 1.0
        return lags, acf_values

    actual_max_lag = min(max_lag, N - 1)
    lags = np.arange(0, actual_max_lag + 1)

    centered = bit_data - mu
    acf_values = []

    for k in lags:
        if k == 0:
            acf_values.append(1.0)
        else:
            left = centered[:N - k]
            right = centered[k:]
            acf = np.sum(left * right) / ((N - k) * sigma ** 2)
            acf_values.append(acf)

    return lags, np.array(acf_values, dtype=np.float64)


def generate_acf_analysis(
    bitstream_file,
    output_plot_path,
    output_excel_path,
    read_count=MAX_ACF_BITS,
    max_lag=MAX_ACF_LAG
):
    try:
        bits = read_bits_from_file(bitstream_file)

        if len(bits) < 2:
            return None

        bits = bits[:min(read_count, len(bits))]
        bit_stream = np.fromiter((1 if c == '1' else 0 for c in bits), dtype=np.uint8)

        if len(bit_stream) < 2:
            return None

        actual_max_lag = min(max_lag, len(bit_stream) - 1)

        print(f"ACF data reading completed, bitstream length used: {len(bit_stream):,}")
        print(f"ACF max lag limited to: {actual_max_lag}")

        lags, acf_vals = calculate_acf_limited(bit_stream, actual_max_lag)

        if lags is None or acf_vals is None:
            return None

        print(f"ACF calculation completed, lag range: 0 ~ {actual_max_lag}")

        N = len(bit_stream)
        conf_95 = 1.96 / np.sqrt(N)

        plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False

        plt.figure(figsize=(10, 5), dpi=150)

        if len(lags) > 1:
            plt.scatter(lags[1:], acf_vals[1:], s=3, color='black', alpha=0.8)

        plt.axhline(y=conf_95, color='gray', linestyle='--', linewidth=1, label=f'95% CI: ±{conf_95:.6f}')
        plt.axhline(y=-conf_95, color='gray', linestyle='--', linewidth=1)
        plt.axhline(y=0, color='red', linestyle='-', linewidth=0.8)

        plt.xlabel('Lag', fontsize=10, fontweight='bold')
        plt.ylabel('Normalized Autocorrelation Coefficient (ACF)', fontsize=10, fontweight='bold')
        plt.title('Random Bitstream Autocorrelation Function', fontsize=12, fontweight='bold', pad=12)
        plt.legend(loc='upper right', fontsize=8)
        plt.grid(alpha=0.2, axis='y')
        plt.xlim(0, actual_max_lag)

        if len(acf_vals) > 1:
            y_min = min(np.min(acf_vals[1:]), -conf_95) * 1.2
            y_max = max(np.max(acf_vals[1:]), conf_95) * 1.2
            if y_min != y_max:
                plt.ylim(y_min, y_max)

        plt.tight_layout()
        plt.savefig(output_plot_path, dpi=150, bbox_inches='tight')
        plt.close()

        df = pd.DataFrame({'Lag': lags[1:], 'ACF': acf_vals[1:]})
        df.to_excel(output_excel_path, index=False, engine='openpyxl')

        print(f"ACF data saved to: {output_excel_path}")
        print(f"ACF plot saved to: {output_plot_path}")

        return {
            "bits_used": len(bit_stream),
            "max_lag": actual_max_lag,
            "confidence_interval_95": float(conf_95),
            "lag_points": len(lags[1:]),
            "use_actual_ci": False
        }

    except Exception as e:
        print(f"Error generating ACF analysis: {e}")
        return None


def analyze_uploaded_bitstream(bitstream_file_path: str):
    input_path = Path(bitstream_file_path)

    if not input_path.exists():
        return {
            "success": False,
            "message": "上传的文件不存在",
            "data": None
        }

    bits = read_bits_from_file(str(input_path))
    total_bits_available = len(bits)

    if total_bits_available == 0:
        return {
            "success": False,
            "message": "文件中没有有效的 0/1 比特流",
            "data": None
        }

    timestamp = int(time.time() * 1000)
    base_name = input_path.stem

    output_result_path = RESULTS_DIR / f"{base_name}_{timestamp}_shannon_entropy.txt"
    output_image_path = IMAGES_DIR / f"{base_name}_{timestamp}_heatmap.png"
    output_acf_plot_path = ACF_IMAGES_DIR / f"{base_name}_{timestamp}_acf_plot.png"
    output_acf_excel_path = ACF_DATA_DIR / f"{base_name}_{timestamp}_acf_data.xlsx"

    print(f"Task1 analysis started, total valid bits: {total_bits_available:,}")

    # 香农熵和 0/1 比例使用完整文件
    result = calculate_bitstream_entropy(str(input_path), n=None)
    if not result:
        return {
            "success": False,
            "message": "香农熵计算失败",
            "data": None
        }

    save_single_entropy_result(result, str(output_result_path), result["total_bits"])

    # 热图只使用前 MAX_HEATMAP_BITS，避免 1Mb 文件生成 1000x1000 高分辨率图导致 Render 压力过大
    visualization_result = generate_bitstream_visualization(
        str(input_path),
        str(output_image_path),
        n=MAX_HEATMAP_BITS
    )

    if not visualization_result:
        return {
            "success": False,
            "message": "热图生成失败",
            "data": None
        }

    # ACF 只使用前 MAX_ACF_BITS，并且最多计算 MAX_ACF_LAG 个 lag
    acf_result = generate_acf_analysis(
        str(input_path),
        str(output_acf_plot_path),
        str(output_acf_excel_path),
        read_count=min(MAX_ACF_BITS, total_bits_available),
        max_lag=min(MAX_ACF_LAG, max(1, min(MAX_ACF_BITS, total_bits_available) - 1))
    )

    if not acf_result:
        return {
            "success": False,
            "message": "ACF 分析失败",
            "data": None
        }

    print("Task1 analysis finished successfully")

    return {
        "success": True,
        "message": "检测完成",
        "data": {
            "entropy": round(result["entropy"], 6),
            "total_bits": result["total_bits"],
            "count_0": result["count_0"],
            "count_1": result["count_1"],
            "p_0": round(result["p_0"], 6),
            "p_1": round(result["p_1"], 6),
            "ratio_text": f"{result['p_0'] * 100:.2f}% / {result['p_1'] * 100:.2f}%",

            "heatmap_url": f"/static/images/{output_image_path.name}",
            "report_url": f"/static/results/{output_result_path.name}",
            "heatmap_rows": visualization_result["rows"],
            "heatmap_cols": visualization_result["cols"],
            "heatmap_bits_used": visualization_result["total_bits"],

            "acf_plot_url": f"/static/acf_images/{output_acf_plot_path.name}",
            "acf_excel_url": f"/static/acf_data/{output_acf_excel_path.name}",
            "acf_bits_used": acf_result["bits_used"],
            "acf_max_lag": acf_result["max_lag"],
            "acf_confidence_interval": round(acf_result["confidence_interval_95"], 6),
            "acf_lag_points": acf_result["lag_points"]
        }
    }
